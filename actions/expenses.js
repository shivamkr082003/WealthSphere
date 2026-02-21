"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const serializeDecimal = (obj) => {
  const serialized = { ...obj };
  if (obj.amount) {
    serialized.amount = obj.amount.toNumber();
  }
  return serialized;
};

// Create group expense
export async function createGroupExpense(data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Verify user is member of the group
    const membership = await db.groupMember.findFirst({
      where: {
        groupId: data.groupId,
        userId: user.id,
      },
    });

    if (!membership) {
      throw new Error("You are not a member of this group");
    }

    // Get all group members and anonymous members
    const groupMembers = await db.groupMember.findMany({
      where: { groupId: data.groupId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    const anonymousMembers = await db.anonymousMember.findMany({
      where: { groupId: data.groupId },
    });

    // Extract the actual user ID from paidBy (remove prefix if present)
    const paidByUserId = data.paidBy.startsWith("user_")
      ? data.paidBy.replace("user_", "")
      : data.paidBy.startsWith("anon_")
        ? data.paidBy.replace("anon_", "")
        : data.paidBy;

    // Validate that paidBy user is a member of the group
    const allMemberIds = [
      ...groupMembers.map((m) => m.userId),
      ...anonymousMembers.map((m) => m.id),
    ];

    if (!allMemberIds.includes(paidByUserId)) {
      throw new Error("Invalid payer: user is not a member of this group");
    }

    // Get selected participants and map them to actual user IDs
    const selectedParticipants = data.participants || [];

    // Process participants to handle both regular users and anonymous members
    const participantUserIds = [];
    const participantAnonIds = [];

    selectedParticipants.forEach((participantId) => {
      if (participantId.startsWith("user_")) {
        participantUserIds.push(participantId.replace("user_", ""));
      } else if (participantId.startsWith("anon_")) {
        participantAnonIds.push(participantId.replace("anon_", ""));
      } else {
        // Handle cases where IDs don't have prefixes
        const isAnonymous = anonymousMembers.some(
          (anon) => anon.id === participantId
        );
        if (isAnonymous) {
          participantAnonIds.push(participantId);
        } else {
          participantUserIds.push(participantId);
        }
      }
    });

    const totalParticipants =
      participantUserIds.length + participantAnonIds.length;

    if (totalParticipants === 0) {
      throw new Error("At least one participant must be selected");
    }

    // Determine if payer is anonymous or regular user
    const isAnonymousPayer = data.paidBy.startsWith("anon_");

    // Calculate shares based on split type
    const totalAmount = parseFloat(data.amount);
    let shareAmount;

    if (data.splitType === "EQUAL") {
      shareAmount = totalAmount / totalParticipants;
    } else {
      throw new Error("Only EQUAL split type is currently supported");
    }

    // Create expense and shares in a transaction
    const expense = await db.$transaction(async (tx) => {
      const newExpense = await tx.groupExpense.create({
        data: {
          groupId: data.groupId,
          ...(isAnonymousPayer
            ? { paidByAnonymousMemberId: paidByUserId }
            : { paidByUserId: paidByUserId }),
          title: data.title,
          description: data.description,
          amount: totalAmount,
          category: data.category,
          date: new Date(data.date),
          receiptUrl: data.receiptUrl,
          splitType: data.splitType,
        },
      });

      // Create expense shares
      const shareData = [];

      // Add shares for regular users
      participantUserIds.forEach((userId) => {
        shareData.push({
          expenseId: newExpense.id,
          userId: userId,
          amount: shareAmount,
          isPaid: !isAnonymousPayer && userId === paidByUserId, // Payer's share is automatically paid
        });
      });

      // Add shares for anonymous members
      participantAnonIds.forEach((anonId) => {
        shareData.push({
          expenseId: newExpense.id,
          anonymousMemberId: anonId,
          amount: shareAmount,
          isPaid: isAnonymousPayer && anonId === paidByUserId, // Payer's share is automatically paid (if anonymous)
        });
      });

      await tx.expenseShare.createMany({
        data: shareData,
      });

      return newExpense;
    });

    revalidatePath(`/groups/${data.groupId}`);
    return { success: true, data: serializeDecimal(expense) };
  } catch (error) {
    throw new Error(error.message);
  }
}

// Get group expenses
export async function getGroupExpenses(groupId) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Verify user is member of the group
    const membership = await db.groupMember.findFirst({
      where: {
        groupId,
        userId: user.id,
      },
    });

    if (!membership) {
      throw new Error("You are not a member of this group");
    }

    const expenses = await db.groupExpense.findMany({
      where: { groupId },
      include: {
        paidBy: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
          },
        },
        paidByAnonymous: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        shares: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                imageUrl: true,
              },
            },
            anonymousMember: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    // Serialize decimal fields
    const serializedExpenses = expenses.map((expense) => ({
      ...serializeDecimal(expense),
      shares: expense.shares.map(serializeDecimal),
    }));

    return serializedExpenses;
  } catch (error) {
    throw new Error(error.message);
  }
}

// Calculate group balances
export async function calculateGroupBalances(groupId) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Verify user is member of the group
    const membership = await db.groupMember.findFirst({
      where: {
        groupId,
        userId: user.id,
      },
    });

    if (!membership) {
      throw new Error("You are not a member of this group");
    }

    const expenses = await db.groupExpense.findMany({
      where: { groupId },
      include: {
        paidBy: {
          select: { id: true, name: true, email: true, imageUrl: true },
        },
        shares: {
          include: {
            user: {
              select: { id: true, name: true, email: true, imageUrl: true },
            },
          },
        },
      },
    });

    // Calculate balances
    const balances = {};
    const members = await db.groupMember.findMany({
      where: { groupId },
      include: {
        user: {
          select: { id: true, name: true, email: true, imageUrl: true },
        },
      },
    });

    // Initialize balances
    members.forEach((member) => {
      balances[member.userId] = {
        user: member.user,
        totalPaid: 0,
        totalOwed: 0,
        netBalance: 0,
      };
    });

    // Calculate from expenses
    expenses.forEach((expense) => {
      const paidByUserId = expense.paidByUserId;
      const expenseAmount = expense.amount.toNumber();

      // Add to payer's total paid
      if (balances[paidByUserId]) {
        balances[paidByUserId].totalPaid += expenseAmount;
      }

      // Add to each member's total owed
      expense.shares.forEach((share) => {
        const shareAmount = share.amount.toNumber();
        if (balances[share.userId]) {
          balances[share.userId].totalOwed += shareAmount;
        }
      });
    });

    // Calculate net balances
    Object.keys(balances).forEach((userId) => {
      balances[userId].netBalance =
        balances[userId].totalPaid - balances[userId].totalOwed;
    });

    return Object.values(balances);
  } catch (error) {
    throw new Error(error.message);
  }
}

// Settle up between users
export async function createSettlement(
  fromUserId,
  toUserId,
  amount,
  description = ""
) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.id !== fromUserId) {
      throw new Error("You can only create settlements for yourself");
    }

    const settlement = await db.settlement.create({
      data: {
        fromUserId,
        toUserId,
        amount: parseFloat(amount),
        description,
        status: "PENDING",
      },
      include: {
        fromUser: {
          select: { id: true, name: true, email: true, imageUrl: true },
        },
        toUser: {
          select: { id: true, name: true, email: true, imageUrl: true },
        },
      },
    });

    // TODO: Send notification to the receiving user
    // await sendSettlementNotification(settlement);

    revalidatePath("/settlements");
    return { success: true, data: serializeDecimal(settlement) };
  } catch (error) {
    throw new Error(error.message);
  }
}

// Mark settlement as completed
export async function markSettlementCompleted(settlementId) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const settlement = await db.settlement.findUnique({
      where: { id: settlementId },
    });

    if (!settlement) {
      throw new Error("Settlement not found");
    }

    if (settlement.toUserId !== user.id) {
      throw new Error("Only the recipient can mark a settlement as completed");
    }

    const updatedSettlement = await db.settlement.update({
      where: { id: settlementId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
      include: {
        fromUser: {
          select: { id: true, name: true, email: true, imageUrl: true },
        },
        toUser: {
          select: { id: true, name: true, email: true, imageUrl: true },
        },
      },
    });

    revalidatePath("/settlements");
    return { success: true, data: serializeDecimal(updatedSettlement) };
  } catch (error) {
    throw new Error(error.message);
  }
}

// Create a payment record for settlement suggestion
export async function recordSettlementPayment(
  fromUserId,
  toUserId,
  amount,
  groupId
) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Check if the IDs are for registered users or anonymous members
    let fromUser = null;
    let toUser = null;
    let fromAnonymousMember = null;
    let toAnonymousMember = null;

    // Try to find as registered users first
    if (fromUserId) {
      fromUser = await db.user.findUnique({
        where: { id: fromUserId },
        select: { id: true, name: true, email: true, imageUrl: true },
      });

      if (!fromUser) {
        // If not found as registered user, try as anonymous member
        fromAnonymousMember = await db.anonymousMember.findUnique({
          where: { id: fromUserId },
          select: { id: true, name: true, email: true },
        });
      }
    }

    if (toUserId) {
      toUser = await db.user.findUnique({
        where: { id: toUserId },
        select: { id: true, name: true, email: true, imageUrl: true },
      });

      if (!toUser) {
        // If not found as registered user, try as anonymous member
        toAnonymousMember = await db.anonymousMember.findUnique({
          where: { id: toUserId },
          select: { id: true, name: true, email: true },
        });
      }
    }

    // Verify user is involved in this settlement
    const userIsFromUser = fromUser && user.id === fromUser.id;
    const userIsToUser = toUser && user.id === toUser.id;

    if (!userIsFromUser && !userIsToUser) {
      throw new Error("You can only record payments you're involved in");
    }

    // Prepare settlement data
    const settlementData = {
      amount: parseFloat(amount),
      description: `Settlement payment in group`,
      status: "COMPLETED",
      settledAt: new Date(),
    };

    // Add appropriate foreign key references
    if (fromUser) {
      settlementData.fromUserId = fromUser.id;
    } else if (fromAnonymousMember) {
      settlementData.fromAnonymousMemberId = fromAnonymousMember.id;
    }

    if (toUser) {
      settlementData.toUserId = toUser.id;
    } else if (toAnonymousMember) {
      settlementData.toAnonymousMemberId = toAnonymousMember.id;
    }

    // Create a settlement record
    const settlement = await db.settlement.create({
      data: settlementData,
      include: {
        fromUser: fromUser
          ? {
              select: { id: true, name: true, email: true, imageUrl: true },
            }
          : false,
        toUser: toUser
          ? {
              select: { id: true, name: true, email: true, imageUrl: true },
            }
          : false,
        fromAnonymousMember: fromAnonymousMember
          ? {
              select: { id: true, name: true, email: true },
            }
          : false,
        toAnonymousMember: toAnonymousMember
          ? {
              select: { id: true, name: true, email: true },
            }
          : false,
      },
    });

    // Revalidate the group page
    revalidatePath(`/groups/${groupId}`);
    return { success: true, data: serializeDecimal(settlement) };
  } catch (error) {
    throw new Error(error.message);
  }
}

// Get user's settlements
export async function getUserSettlements() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const settlements = await db.settlement.findMany({
      where: {
        OR: [{ fromUserId: user.id }, { toUserId: user.id }],
      },
      include: {
        fromUser: {
          select: { id: true, name: true, email: true, imageUrl: true },
        },
        toUser: {
          select: { id: true, name: true, email: true, imageUrl: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return settlements.map(serializeDecimal);
  } catch (error) {
    throw new Error(error.message);
  }
}