"use server";

import { auth } from "@clerk/nextjs/server";
import { withDbConnection, handleDatabaseError } from "@/lib/db-wrapper";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";


// ✅ 1. OpenAI import karein
import OpenAI from "openai";

// ✅ 2. OpenAI Client initialize karein
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const serializeAmount = (obj) => ({
  ...obj,
  amount: obj.amount.toNumber(),
});

// Create Transaction
export async function createTransaction(data, req) {
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

      const account = await db.account.findUnique({
        where: {
          id: data.accountId,
          userId: user.id,
        },
      });

      if (!account) {
        throw new Error("Account not found");
      }

      // Calculate new balance
      const balanceChange =
        data.type === "EXPENSE" ? -data.amount : data.amount;
      const newBalance = account.balance.toNumber() + balanceChange;

      // Create transaction and update account balance
      const transaction = await db.$transaction(async (tx) => {
        const newTransaction = await tx.transaction.create({
          data: {
            ...data,
            userId: user.id,
            nextRecurringDate:
              data.isRecurring && data.recurringInterval
                ? calculateNextRecurringDate(data.date, data.recurringInterval)
                : null,
          },
        });

        await tx.account.update({
          where: { id: data.accountId },
          data: { balance: newBalance },
        });

        return newTransaction;
      });

      revalidatePath("/dashboard");
      revalidatePath(`/account/${transaction.accountId}`);

      return { success: true, data: serializeAmount(transaction) };
    });
  } catch (error) {
    const dbError = handleDatabaseError(error);
    throw new Error(dbError.message);
  }
}

export async function getTransaction(id) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    return await withDbConnection(async (db) => {
      const user = await db.user.findUnique({
        where: { clerkUserId: userId },
      });

      if (!user) throw new Error("User not found");

      const transaction = await db.transaction.findUnique({
        where: {
          id,
          userId: user.id,
        },
      });

      if (!transaction) throw new Error("Transaction not found");

      return serializeAmount(transaction);
    });
  } catch (error) {
    const dbError = handleDatabaseError(error);
    throw new Error(dbError.message);
  }
}

export async function updateTransaction(id, data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    // Get original transaction to calculate balance change
    const originalTransaction = await db.transaction.findUnique({
      where: {
        id,
        userId: user.id,
      },
      include: {
        account: true,
      },
    });

    if (!originalTransaction) throw new Error("Transaction not found");

    // Calculate balance changes
    const oldBalanceChange =
      originalTransaction.type === "EXPENSE"
        ? -originalTransaction.amount.toNumber()
        : originalTransaction.amount.toNumber();

    const newBalanceChange =
      data.type === "EXPENSE" ? -data.amount : data.amount;

    const netBalanceChange = newBalanceChange - oldBalanceChange;

    // Update transaction and account balance in a transaction
    const transaction = await db.$transaction(async (tx) => {
      const updated = await tx.transaction.update({
        where: {
          id,
          userId: user.id,
        },
        data: {
          ...data,
          nextRecurringDate:
            data.isRecurring && data.recurringInterval
              ? calculateNextRecurringDate(data.date, data.recurringInterval)
              : null,
        },
      });

      // Update account balance
      await tx.account.update({
        where: { id: data.accountId },
        data: {
          balance: {
            increment: netBalanceChange,
          },
        },
      });

      return updated;
    });

    revalidatePath("/dashboard");
    revalidatePath(`/account/${data.accountId}`);

    return { success: true, data: serializeAmount(transaction) };
  } catch (error) {
    throw new Error(error.message);
  }
}

// Get User Transactions
export async function getUserTransactions(query = {}) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const transactions = await db.transaction.findMany({
      where: {
        userId: user.id,
        ...query,
      },
      include: {
        account: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    return { success: true, data: transactions };
  } catch (error) {
    throw new Error(error.message);
  }
}





// ✅ 3. Scan Receipt Function (Refactored for OpenAI)
export async function scanReceipt(file) {
  console.log("--- SCAN START ---", file.name, file.size);
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    // Convert ArrayBuffer to Base64 string
    const base64String = Buffer.from(arrayBuffer).toString("base64");

    // OpenAI Chat Completion with Vision
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Vision support ke liye best model
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this receipt image and extract the following information in JSON format:
              - Total amount (number only)
              - Date (ISO format)
              - Description (brief summary)
              - Merchant name
              - Category (one of: housing, transportation, groceries, utilities, entertainment, food, shopping, healthcare, education, personal, travel, insurance, gifts, bills, other-expense)

              Return only valid JSON. If not a receipt, return empty object {}.`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${file.type || "image/jpeg"};base64,${base64String}`,
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" }, // ✅ Sabse bada fayda: Strict JSON output
    });
    console.log("OpenAI Response:", response.choices[0].message.content); // ✅ Debugging ke liye
    const data = JSON.parse(response.choices[0].message.content);

    // Agar empty object hai (not a receipt)
    if (Object.keys(data).length === 0) {
      return null;
    }

    return {
      amount: parseFloat(data["Total amount"] || data.amount || 0),
  date: data.Date ? new Date(data.Date) : new Date(),
  description: data.Description || data.description || "",
  category: data.Category || data.category || "food",
  merchantName: data["Merchant name"] || data.merchantName || "",
    };
  } catch (error) {
    console.error("Error scanning receipt with OpenAI:", error);
    throw new Error("Failed to scan receipt");
  }
}



// Helper function to calculate next recurring date
function calculateNextRecurringDate(startDate, interval) {
  const date = new Date(startDate);

  switch (interval) {
    case "DAILY":
      date.setDate(date.getDate() + 1);
      break;
    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      break;
    case "MONTHLY":
      date.setMonth(date.getMonth() + 1);
      break;
    case "YEARLY":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return date;
}