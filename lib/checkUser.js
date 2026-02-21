//this file is made so that whenever the user logs in , automatically the data is stored in database

import { currentUser } from "@clerk/nextjs/server";
import { withDbConnection } from "./db-wrapper";
import { error_codes, getErrorMessage } from "./error-codes";

export const checkUser = async () => {
  try {
    const user = await currentUser();

    if (!user) {
      return null;
    }

    // Use the withDbConnection wrapper to handle connection issues
    return await withDbConnection(async (db) => {
      const loggedInUser = await db.user.findUnique({
        where: {
          clerkUserId: user.id,
        },
      });

      if (loggedInUser) {
        return loggedInUser;
      }

      const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();

      const newUser = await db.user.create({
        data: {
          clerkUserId: user.id,
          name: name || "User",
          imageUrl: user.imageUrl || "",
          email: user.emailAddresses?.[0]?.emailAddress || "",
        },
      });

      return newUser;
    });
  } catch (error) {
    console.log("Error in checkUser:", error.message);
    // Return null instead of letting the error propagate
    // This prevents the Header from failing if the database is unavailable
    return null;
  }
};
