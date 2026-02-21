import { PrismaClient } from "@prisma/client";

// Minimal, robust Prisma client setup compatible with modern Prisma versions
const globalForPrisma = globalThis;

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// Enhanced connection health check with wake-up logic
export async function ensureDbConnection(maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Database connection attempt ${attempt}/${maxRetries}`);

      // Try to connect
      await db.$connect();

      // Test the connection with a simple query
      await db.$queryRaw`SELECT 1`;

      console.log("Database connection successful");
      return true;
    } catch (error) {
      console.error(`Database connection failed (attempt ${attempt}):`, error);

      // Check if it's a Supabase pausing error
      if (isSupabasePausingError(error)) {
        console.log(
          "Detected Supabase database pausing. Attempting to wake up..."
        );

        if (attempt < maxRetries) {
          // Wait progressively longer for Supabase to wake up
          const waitTime = attempt * 5000; // 5s, 10s, 15s
          console.log(`Waiting ${waitTime}ms for database to wake up...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));

          // Try to disconnect and reconnect
          try {
            await db.$disconnect();
          } catch (disconnectError) {
            console.log(
              "Disconnect error (expected):",
              disconnectError.message
            );
          }

          continue; // Try again
        }
      }

      // If it's the last attempt or not a pausing error, throw
      if (attempt === maxRetries) {
        throw new Error(
          `Database is currently unavailable after ${maxRetries} attempts. ` +
            `This may be due to Supabase free tier inactivity. ` +
            `Please wait a few minutes and try again.`
        );
      }
    }
  }
}

// Check if error is related to Supabase database pausing
function isSupabasePausingError(error) {
  const pausingErrorIndicators = [
    "P1001", // Can't reach database server
    "Connection closed",
    "Connection terminated",
    "Connection refused",
    "Connection timeout",
    "connect ECONNREFUSED",
    "ENOTFOUND",
    "timeout",
    "server has gone away",
    "connection pool timeout",
  ];

  const errorMessage = error.message?.toLowerCase() || "";
  const errorCode = error.code || "";

  return pausingErrorIndicators.some(
    (indicator) =>
      errorMessage.includes(indicator.toLowerCase()) || errorCode === indicator
  );
}

// Periodic ping to keep database active (call this in a cron job or scheduled function)
export async function pingDatabase() {
  try {
    await ensureDbConnection(1); // Single attempt for ping
    console.log("Database ping successful");
    return { success: true, timestamp: new Date().toISOString() };
  } catch (error) {
    console.error("Database ping failed:", error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

// we are initializing prisma client as issi se ham db calls and actions krenge

// globalThis.prisma: This global variable ensures that the Prisma client instance is
// reused across hot reloads during development. Without this, each time your application
// reloads, a new instance of the Prisma client would be created, potentially leading
// to connection issues.
