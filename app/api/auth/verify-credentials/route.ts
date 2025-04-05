import { NextResponse } from "next/server";
import { getUsers } from "@/lib/data-utils";

export async function POST(request: Request) {
  try {
    const { name, userId } = await request.json();

    if (!name || !userId) {
      return NextResponse.json(
        { message: "Name and user ID are required" },
        { status: 400 }
      );
    }

    console.log("API Verify Credentials:", { name, userId });

    // Get all users from the server-side JSON file
    const users = await getUsers();

    if (!Array.isArray(users)) {
      console.error("Users data is not an array:", users);
      return NextResponse.json(
        { message: "Server data error" },
        { status: 500 }
      );
    }

    // Find matching user by name and ID with null checks
    const matchedUser = users.find(
      (user) =>
        user &&
        user.name &&
        user.id &&
        user.name.toLowerCase() === name.toLowerCase() &&
        user.id === userId
    );

    console.log("Matched user:", matchedUser ? matchedUser.id : "Not found");

    if (matchedUser) {
      // Return the matched user (exclude sensitive data if needed)
      return NextResponse.json({
        success: true,
        user: {
          id: matchedUser.id,
          name: matchedUser.name,
          email: matchedUser.email,
          accountBalance: matchedUser.accountBalance || 10000,
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid credentials",
        },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error verifying credentials:", error);
    return NextResponse.json(
      { message: "Server error during credential verification" },
      { status: 500 }
    );
  }
}
