import { NextResponse } from "next/server";
import { pingDatabase } from "@/lib/prisma";

// Ensure Node.js runtime for Prisma compatibility
export const runtime = "nodejs";

// Simple API endpoint that's guaranteed to return a valid response
export async function GET() {
  // Use a simpler approach that won't fail with serialization errors
  try {
    // Forward to the safer dbcheck endpoint
    return NextResponse.redirect(
      new URL(
        "/api/dbcheck",
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      )
    );
  } catch (error) {
    // If redirect fails for any reason, return a simple valid response
    try {
      return NextResponse.json({
        status: "error",
        message: "Ping redirector failed",
        error: (error && error.message) || String(error),
        timestamp: new Date().toISOString(),
      });
    } catch (jsonError) {
      // Last resort - plain text
      return new NextResponse("Ping service error", {
        status: 500,
        headers: { "Content-Type": "text/plain" },
      });
    }
  }
}

// Optional POST endpoint for manual database wake-up
export async function POST() {
  try {
    console.log("Manual database wake-up requested");
    const result = await pingDatabase();

    return NextResponse.json({
      status: result.success ? "success" : "error",
      message: result.success
        ? "Database manually awakened"
        : "Failed to wake database",
      error: result.error || null,
      timestamp: result.timestamp,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Manual wake-up failed",
        error: (error && error.message) || String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
