"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import crypto from "crypto";


const serializeDecimal = (obj) => {
  const serialized = { ...obj };
  if (obj.amount) {
    serialized.amount = obj.amount.toNumber();
  }
  return serialized;
};

// Create a new group
export async function createGroup(data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const group = await db.group.create({
      data: {
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
        createdById: user.id,
        members: {
          create: {
            userId: user.id,
            role: "ADMIN",
          },
        },
        // Create anonymous members if provided
        ...(data.members &&
          data.members.length > 0 && {
            anonymousMembers: {
              create: data.members.map((member) => ({
                name: member.name,
                email: member.email || null,
              })),
            },
          }),
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                imageUrl: true,
              },
            },
          },
        },
        anonymousMembers: true,
        _count: {
          select: {
            members: true,
            expenses: true,
          },
        },
      },
    });

    // Revalidate paths and cache
    revalidatePath("/groups");
    revalidateTag("groups");

    return { success: true, data: group };
  } catch (error) {
    throw new Error(error.message);
  }
}

// Get user's groups
export async function getUserGroups() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const groups = await db.group.findMany({
      where: {
        members: {
          some: {
            userId: user.id,
          },
        },
        isActive: true,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                imageUrl: true,
              },
            },
          },
        },
        anonymousMembers: {
          where: {
            isActive: true,
          },
        },
        _count: {
          select: {
            members: true,
            anonymousMembers: {
              where: {
                isActive: true,
              },
            },
            expenses: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return groups;
  } catch (error) {
    throw new Error(error.message);
  }
}

// Get group details
export async function getGroupDetails(groupId) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is member of the group
    const membership = await db.groupMember.findFirst({
      where: {
        groupId,
        userId: user.id,
      },
    });

    if (!membership) {
      throw new Error("You are not a member of this group");
    }

    const group = await db.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                imageUrl: true,
              },
            },
          },
        },
        anonymousMembers: {
          where: {
            isActive: true,
          },
        },
        expenses: {
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
        },
      },
    });

    if (!group) {
      throw new Error("Group not found");
    }

    // Serialize decimal fields
    const serializedGroup = {
      ...group,
      expenses: group.expenses.map((expense) => ({
        ...serializeDecimal(expense),
        shares: expense.shares.map(serializeDecimal),
      })),
    };

    return serializedGroup;
  } catch (error) {
    throw new Error(error.message);
  }
}

// Invite user to group
export async function inviteUserToGroup(groupId, email) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    const membership = await db.groupMember.findFirst({
      where: { groupId, userId: user.id, role: "ADMIN" },
    });

    if (!membership) throw new Error("You don't have permission to invite users");

    const existingInvitation = await db.groupInvitation.findFirst({
      where: { groupId, email, status: "PENDING" },
    });

    if (existingInvitation) throw new Error("User is already invited");

    const invitedUser = await db.user.findUnique({
      where: { email },
    });

    if (invitedUser) {
      const existingMember = await db.groupMember.findFirst({
        where: { groupId, userId: invitedUser.id },
      });
      if (existingMember) throw new Error("User is already a member");
    }

    // ✅ FIX 1: 'invitation' variable define karein
    const invitation = await db.groupInvitation.create({
      data: {
        group: { connect: { id: groupId } },
        sender: { connect: { id: user.id } },
        // Agar invitedUser DB mein hai toh use connect karein, warna null rehne dein
        ...(invitedUser?.id && {
          receiver: { connect: { id: invitedUser.id } }
        }),
        email,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: "PENDING",
      },
    });
    // await sendInvitationEmail(invitation);

    revalidatePath(`/groups/${groupId}`);
    
    // ✅ FIX 2: Ab 'invitation' defined hai, toh error nahi aayega
    return { success: true, data: invitation };

  } catch (error) {
    throw new Error(error.message);
  }
}

// Accept group invitation
export async function acceptGroupInvitation(invitationId) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const invitation = await db.groupInvitation.findUnique({
      where: { id: invitationId },
      include: {
        group: true,
      },
    });

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    if (invitation.email !== user.email) {
      throw new Error("This invitation is not for you");
    }

    if (invitation.status !== "PENDING") {
      throw new Error("Invitation is no longer valid");
    }

    if (invitation.expiresAt < new Date()) {
      throw new Error("Invitation has expired");
    }

    // Add user to group and update invitation status
    await db.$transaction([
      db.groupMember.create({
        data: {
          groupId: invitation.groupId,
          userId: user.id,
          role: "MEMBER",
        },
      }),
      db.groupInvitation.update({
        where: { id: invitationId },
        data: { status: "ACCEPTED" },
      }),
    ]);

    revalidatePath("/groups");
    revalidatePath(`/groups/${invitation.groupId}`);
    return { success: true };
  } catch (error) {
    throw new Error(error.message);
  }
}

// Get user's pending invitations
export async function getUserInvitations() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const invitations = await db.groupInvitation.findMany({
      where: {
        email: user.email,
        status: "PENDING",
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
          },
        },
        sender: {
          select: {
            name: true,
            email: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return invitations;
  } catch (error) {
    throw new Error(error.message);
  }
}

// Calculate group balances and settlements
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

    // Check if user is member of the group
    const membership = await db.groupMember.findFirst({
      where: {
        groupId,
        userId: user.id,
      },
    });

    if (!membership) {
      throw new Error("You are not a member of this group");
    }

    // Get all expenses and their shares for this group
    const expenses = await db.groupExpense.findMany({
      where: { groupId },
      include: {
        paidBy: {
          select: {
            id: true,
            name: true,
            email: true,
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
    });

    // Calculate balances for each user
    const balances = {};
    const userMap = {};

    // Initialize balances and user map
    expenses.forEach((expense) => {
      // Add payer to userMap (either regular user or anonymous)
      const payer = expense.paidBy || expense.paidByAnonymous;
      if (payer && !userMap[payer.id]) {
        userMap[payer.id] = payer;
        balances[payer.id] = 0;
      }

      // Add all participants to userMap (both regular users and anonymous members)
      expense.shares.forEach((share) => {
        const participant = share.user || share.anonymousMember;
        if (participant && !userMap[participant.id]) {
          userMap[participant.id] = participant;
          balances[participant.id] = 0;
        }
      });
    });

    // Calculate what each person paid vs what they owe
    const totalPaidByUser = {}; // Track how much each person actually paid
    const totalOwedByUser = {}; // Track how much each person owes

    // Initialize tracking objects
    Object.keys(balances).forEach((userId) => {
      totalPaidByUser[userId] = 0;
      totalOwedByUser[userId] = 0;
    });

    expenses.forEach((expense) => {
      const totalAmount = expense.amount.toNumber();
      const payer = expense.paidBy || expense.paidByAnonymous;

      if (payer) {
        // Person who paid gets credited
        balances[payer.id] += totalAmount;
        totalPaidByUser[payer.id] += totalAmount;
      }

      // Each person who has a share gets debited
      expense.shares.forEach((share) => {
        const shareAmount = share.amount.toNumber();
        const participant = share.user || share.anonymousMember;
        if (participant) {
          balances[participant.id] -= shareAmount;
          totalOwedByUser[participant.id] += shareAmount;
        }
      });
    });

    // Convert to array format with user details
    const balancesList = Object.entries(balances).map(([userId, balance]) => ({
      user: userMap[userId],
      balance: Number(balance.toFixed(2)),
      netBalance: Number(balance.toFixed(2)),
      totalPaid: Number((totalPaidByUser[userId] || 0).toFixed(2)),
      totalOwed: Number((totalOwedByUser[userId] || 0).toFixed(2)),
      owes: balance < 0 ? Math.abs(balance) : 0,
      owed: balance > 0 ? balance : 0,
    }));

    // Calculate suggested settlements (simplified)
    const settlements = [];
    const debtors = balancesList
      .filter((b) => b.balance < 0)
      .sort((a, b) => a.balance - b.balance);
    const creditors = balancesList
      .filter((b) => b.balance > 0)
      .sort((a, b) => b.balance - a.balance);

    let i = 0,
      j = 0;
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const amount = Math.min(Math.abs(debtor.balance), creditor.balance);

      if (amount > 0.01) {
        // Avoid tiny settlements
        settlements.push({
          from: debtor.user,
          to: creditor.user,
          amount: Number(amount.toFixed(2)),
        });
      }

      debtor.balance += amount;
      creditor.balance -= amount;

      if (Math.abs(debtor.balance) < 0.01) i++;
      if (Math.abs(creditor.balance) < 0.01) j++;
    }

    return {
      balances: balancesList,
      settlements,
      totalExpenses: expenses.reduce(
        (sum, exp) => sum + exp.amount.toNumber(),
        0
      ),
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

// Generate invite link for group
export async function generateGroupInviteLink(groupId) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is admin of the group
    const membership = await db.groupMember.findFirst({
      where: {
        groupId,
        userId: user.id,
        role: "ADMIN",
      },
    });

    if (!membership) {
      throw new Error(
        "You don't have permission to generate invite links for this group"
      );
    }

    // Generate a secure token
    const token = crypto.randomBytes(32).toString("hex");

    // Delete any existing invite link tokens for this group (cleanup)
    await db.groupInvitation.deleteMany({
      where: {
        groupId,
        email: {
          startsWith: "invite_link_",
        },
        status: "PENDING",
      },
    });

    // Create new invite token
const inviteToken = await db.groupInvitation.create({
  data: {
    // 1. Direct groupId ki jagah 'group' relation use karo
    group: {
      connect: { id: groupId }
    },
    // 2. Sender ko bhi 'sender' relation se connect karo
    sender: {
      connect: { id: user.id }
    },
    receiverUserId: undefined, 
    email: `invite_link_${token}`,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
    status: "PENDING",
  },
});

    const inviteUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://wealth-sphere-hqr5.vercel.app"}/invite/${groupId}/${token}`;

    return {
      success: true,
      data: { inviteUrl, token, expiresAt: inviteToken.expiresAt },
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

// Join group via invite link
export async function joinGroupViaInviteLink(groupId, token) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Find the invite token
    const invitation = await db.groupInvitation.findFirst({
      where: {
        groupId,
        email: `invite_link_${token}`,
        status: "PENDING",
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        group: true,
      },
    });

    if (!invitation) {
      throw new Error("Invalid or expired invite link");
    }

    // Check if user is already a member
    const existingMember = await db.groupMember.findFirst({
      where: {
        groupId,
        userId: user.id,
      },
    });

    if (existingMember) {
      throw new Error("You are already a member of this group");
    }

    // Add user to group
    await db.groupMember.create({
      data: {
        groupId,
        userId: user.id,
        role: "MEMBER",
      },
    });

    revalidatePath("/groups");
    revalidatePath(`/groups/${groupId}`);
    return { success: true, group: invitation.group };
  } catch (error) {
    throw new Error(error.message);
  }
}

// Update group status
export async function updateGroupStatus(groupId, status) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is admin of the group
    const membership = await db.groupMember.findFirst({
      where: {
        groupId,
        userId: user.id,
        role: "ADMIN",
      },
    });

    if (!membership) {
      throw new Error("You don't have permission to update this group");
    }

    const updatedGroup = await db.group.update({
      where: { id: groupId },
      data: { status },
    });

    revalidatePath(`/groups/${groupId}`);
    revalidatePath("/groups");
    return { success: true, group: updatedGroup };
  } catch (error) {
    throw new Error(error.message);
  }
}

// Remove member from group
export async function removeGroupMember(
  groupId,
  memberId,
  memberType = "user"
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

    // Check if user is admin of the group
    const membership = await db.groupMember.findFirst({
      where: {
        groupId,
        userId: user.id,
        role: "ADMIN",
      },
    });

    if (!membership) {
      throw new Error(
        "You don't have permission to remove members from this group"
      );
    }

    if (memberType === "user") {
      // Remove registered user
      await db.groupMember.delete({
        where: { id: memberId },
      });
    } else {
      // Remove anonymous member
      await db.anonymousMember.update({
        where: { id: memberId },
        data: { isActive: false },
      });
    }

    revalidatePath(`/groups/${groupId}`);
    return { success: true };
  } catch (error) {
    throw new Error(error.message);
  }
}

// Delete group permanently
export async function deleteGroup(groupId) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is admin of the group
    const membership = await db.groupMember.findFirst({
      where: {
        groupId,
        userId: user.id,
        role: "ADMIN",
      },
    });

    if (!membership) {
      throw new Error("You don't have permission to delete this group");
    }

    // Delete the group (cascade deletes will handle related data)
    await db.group.delete({
      where: { id: groupId },
    });

    revalidatePath("/groups");
    revalidateTag("groups");
    return { success: true };
  } catch (error) {
    throw new Error(error.message);
  }
}
