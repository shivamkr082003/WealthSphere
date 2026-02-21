import { db, ensureDbConnection } from "./prisma";
import { error_codes, getErrorMessage } from "./error-codes";

// Database operation wrapper with retry logic
export async function withDbConnection(operation) {
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Ensure database connection is active
      await ensureDbConnection();

      // Execute the operation
      return await operation(db);
    } catch (error) {
      lastError = error;
      console.error(
        `Database operation failed (attempt ${attempt}/${maxRetries}):`,
        error
      );

      // If it's a connection error and we have retries left, wait and retry
      if (attempt < maxRetries && isConnectionError(error)) {
        const delay = attempt * 1000; // Exponential backoff: 1s, 2s, 3s
        console.log(`Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // If it's not a connection error or we're out of retries, handle and throw
      const handledError = handleDatabaseError(error);
      throw new Error(handledError.message);
    }
  }

  const finalError = handleDatabaseError(lastError);
  throw new Error(finalError.message);
}

// Check if error is related to database connection
function isConnectionError(error) {
  const connectionErrorMessages = [
    "Connection closed",
    "Connection terminated",
    "Connection refused",
    "Connection timeout",
    "Connection lost",
    "connect ECONNREFUSED",
    "database is closed",
    "connection pool timeout",
    "server has gone away",
    "P1001", // Can't reach database server
    "P1017", // Server has terminated the connection
  ];

  const errorMessage = error.message?.toLowerCase() || "";
  const errorCode = error.code || "";

  return connectionErrorMessages.some(
    (msg) => errorMessage.includes(msg.toLowerCase()) || errorCode === msg
  );
}

// Check specifically for Supabase paused errors
export function isSupabasePausedError(error) {
  // On Supabase free tier, these errors commonly indicate the DB is paused
  const pausedErrorIndicators = [
    "P1001", // Can't reach database server
    "P1017", // Server has terminated the connection
    "Connection refused",
    "Connection timeout",
    "cannot connect",
  ];

  const errorMessage = error.message?.toLowerCase() || "";
  const errorCode = error.code || "";

  return pausedErrorIndicators.some(
    (indicator) =>
      errorMessage.includes(indicator.toLowerCase()) || errorCode === indicator
  );
}

// Enhanced error handling for Supabase free tier
export function handleDatabaseError(error) {
  if (isSupabasePausedError(error)) {
    return {
      error: true,
      message: getErrorMessage(error_codes.SUPABASE_PAUSED),
      code: error_codes.SUPABASE_PAUSED,
    };
  }

  if (isConnectionError(error)) {
    return {
      error: true,
      message: getErrorMessage(error_codes.CONNECTION_ERROR),
      code: error_codes.CONNECTION_ERROR,
    };
  }

  // Handle other common database errors
  if (error.code === "P2002") {
    return {
      error: true,
      message: getErrorMessage(error_codes.DUPLICATE_ERROR),
      code: error_codes.DUPLICATE_ERROR,
    };
  }

  if (error.code === "P2025") {
    return {
      error: true,
      message: getErrorMessage(error_codes.NOT_FOUND_ERROR),
      code: error_codes.NOT_FOUND_ERROR,
    };
  }

  // Generic error
  return {
    error: true,
    message: error.message || getErrorMessage(error_codes.SERVER_ERROR),
    code: error_codes.SERVER_ERROR,
  };
}
