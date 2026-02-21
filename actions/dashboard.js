"use server";
import { withDbConnection, handleDatabaseError } from "@/lib/db-wrapper";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";

const serializeTransaction = (obj) => {
  const serialized = { ...obj };
  if (obj.balance) {
    serialized.balance = obj.balance.toNumber();
  }
  if (obj.amount) {
    serialized.amount = obj.amount.toNumber();
  }
  return serialized;
};

// Cache user accounts for 30 seconds
const getCachedUserAccounts = unstable_cache(
  async (userId) => {
    return await withDbConnection(async (db) => {
      const user = await db.user.findUnique({
        where: { clerkUserId: userId },
      });

      if (!user) {
        throw new Error("User not found");
      }

      const accounts = await db.account.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              transactions: true,
            },
          },
        },
      });

      return accounts.map(serializeTransaction);
    });
  },
  ["user-accounts"],
  {
    revalidate: 30, // Cache for 30 seconds
    tags: ["accounts"],
  }
);

export async function getUserAccounts() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    return await getCachedUserAccounts(userId);
  } catch (error) {
    const dbError = handleDatabaseError(error);
    throw new Error(dbError.message);
  }
}

export async function createAccount(data) {
  try {
    console.log(data);

    const { userId } = await auth();
    console.log(userId);
    if (!userId) throw new Error("Unauthorized");

    return await withDbConnection(async (db) => {
      const user = await db.user.findUnique({
        where: { clerkUserId: userId },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Convert balance to float before saving
      const balanceFloat = parseFloat(data.balance);
      if (isNaN(balanceFloat)) {
        throw new Error("Invalid balance amount");
      }

      // Check if this is the user's first account
      const existingAccounts = await db.account.findMany({
        where: { userId: user.id },
      });

      // If it's the first account, make it default regardless of user input
      // If not, use the user's preference
      const shouldBeDefault =
        existingAccounts.length === 0 ? true : data.isDefault;

      // If this account should be default, unset other default accounts
      if (shouldBeDefault) {
        await db.account.updateMany({
          where: { userId: user.id, isDefault: true },
          data: { isDefault: false },
        });
      }

      // Create new account
      const account = await db.account.create({
        data: {
          ...data,
          balance: balanceFloat,
          userId: user.id,
          isDefault: shouldBeDefault, // Override the isDefault based on our logic
        },
      });

      // Serialize the account before returning
      const serializedAccount = serializeTransaction(account);

      // Revalidate paths and invalidate cache
      revalidatePath("/dashboard");
      revalidatePath("/account");

      // Invalidate the accounts cache
      revalidateTag("accounts");

      return { success: true, data: serializedAccount };
    });
  } catch (error) {
    const dbError = handleDatabaseError(error);
    throw new Error(dbError.message);
  }
}

export async function getDashboardData() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    return await withDbConnection(async (db) => {
      const user = await db.user.findUnique({
        where: { clerkUserId: userId },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Get all user transactions
      const transactions = await db.transaction.findMany({
        where: { userId: user.id },
        orderBy: { date: "desc" },
      });

      return transactions.map(serializeTransaction);
    });
  } catch (error) {
    const dbError = handleDatabaseError(error);
    throw new Error(dbError.message);
  }
}