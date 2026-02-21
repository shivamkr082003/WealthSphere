import { withDbConnection } from "@/lib/db-wrapper";
import { db } from "@/lib/prisma";

// Wrapper around any DB operation to ensure connection and handle errors
export const getDbStatus = withDbConnection(async () => {
  try {
    // Simple query to test connection
    const result = await db.$queryRaw`SELECT now() as current_time`;

    return {
      status: "connected",
      timestamp: result[0].current_time,
      message: "Database connection is working",
    };
  } catch (error) {
    console.error("Database status check failed:", error);
    throw error; // withDbConnection will handle this
  }
});

export async function isSupabaseAwake() {
  try {
    const status = await getDbStatus();
    return status.status === "connected";
  } catch (error) {
    console.error("Supabase status check failed:", error);
    return false;
  }
}