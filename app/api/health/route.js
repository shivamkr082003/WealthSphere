import { NextResponse } from "next/server";

// Simple API health check that doesn't depend on database connection
export async function GET() {
  try {
    // Basic system health check that doesn't require database
    const memory = process.memoryUsage();
    const health = {
      status: "online",
      uptime: process.uptime(),
      memoryUsage: {
        rss: `${Math.round(memory.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)} MB`,
      },
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    };

    return NextResponse.json(health);
  } catch (error) {
    console.error("API health check failed:", error);

    return NextResponse.json(
      {
        status: "error",
        message: "API health check failed",
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
