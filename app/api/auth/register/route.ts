import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getUsers, saveUsers } from "@/lib/data-utils";
import { sendWelcomeEmail } from "@/lib/email-utils";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, email, age, address, bankAccountNumber } = data;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Create new user
    const newUser = {
      id: uuidv4(),
      name,
      email,
      age: parseInt(age) || 0,
      address: address || "",
      bankAccountNumber: bankAccountNumber || "",
      accountBalance: 10000, // Default starting balance
      registeredAt: new Date().toISOString(),
      faceImagesCaptured: false,
    };

    // Save user to database
    const users = await getUsers();
    users.push(newUser);
    await saveUsers(users);

    // Send welcome email
    try {
      await sendWelcomeEmail(newUser);
      console.log(`Welcome email sent to ${newUser.email}`);
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Continue with registration even if email fails
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        accountBalance: newUser.accountBalance,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
