import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Force Node.js runtime to ensure Prisma works and avoid Edge serialization quirks
export const runtime = "nodejs";

// This API route is a safer version of the ping endpoint that handles errors better
export async function GET() {
  let responseStatus = 200;
  let responseBody = {
    status: "unknown",
    message: "Database check not completed",
    timestamp: new Date().toISOString(),
  };

  // Clear error if env is not configured
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "DATABASE_URL is not set. Create .env.local and restart the dev server.",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }

  try {
    // Simple check to see if database is available
    // Using a simple query instead of ensureDbConnection to avoid potential errors
    await db.$queryRaw`SELECT 1 as alive`;

    responseBody = {
      status: "success",
      message: "Database connection successful",
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    // Never assume error is an Error; guard against null/strings/unknown
    const errMsg =
      error && typeof error === "object" && "message" in error
        ? error.message
        : String(error ?? "Unknown database error");
    console.error("Database check failed:", errMsg);
    responseStatus = 503; // Service Unavailable

    responseBody = {
      status: "error",
      message: "Database connection failed",
      error: errMsg,
      timestamp: new Date().toISOString(),
    };
  }

  // Return response, using try/catch to make sure we always return valid JSON
  try {
    return NextResponse.json(responseBody, { status: responseStatus });
  } catch (jsonError) {
    // If JSON serialization somehow fails, return a simple text response
    const fallback = {
      status: "error",
      message: "Database status check failed with serialization error",
      timestamp: new Date().toISOString(),
    };
    try {
      return NextResponse.json(fallback, { status: 500 });
    } catch {
      return new NextResponse(
        "Database status check failed with serialization error",
        { status: 500, headers: { "Content-Type": "text/plain" } }
      );
    }
  }
}
