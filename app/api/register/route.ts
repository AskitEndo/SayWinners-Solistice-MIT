// app/api/register/route.ts
import { NextResponse } from "next/server";
import fs from "fs/promises"; // Use promises version of fs
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { getUsers, saveUsers } from "@/lib/data-utils"; // Adjusted path if needed
import { User } from "@/lib/types";

// Define the path for storing user images relative to the project root
// IMPORTANT: Ensure this 'data' directory is writable by the server process.
// It's generally better practice to store user uploads outside the main app code,
// but for this local-storage approach, we'll put it under 'data'.
const USER_IMAGES_BASE_PATH = path.join(process.cwd(), "data", "user_images");

// Ensure the base directory for user images exists
async function ensureUserImagesDirExists() {
  try {
    await fs.access(USER_IMAGES_BASE_PATH);
  } catch (error) {
    console.log("User images directory doesn't exist, creating...");
    await fs.mkdir(USER_IMAGES_BASE_PATH, { recursive: true }); // Create parent dirs if needed
  }
}

// --- POST Handler for Registration ---
export async function POST(request: Request) {
  console.log("API Route: Received registration request.");

  try {
    const body = await request.json();

    // --- Basic Input Validation ---
    const { name, email, age, address, bankAccount, images } = body;
    if (
      !name ||
      !email ||
      !age ||
      !address ||
      !bankAccount ||
      !Array.isArray(images) ||
      images.length === 0
    ) {
      console.error("API Route: Invalid registration data received.", body);
      return NextResponse.json(
        { message: "Missing required fields or images." },
        { status: 400 }
      );
    }

    // --- Check if User Exists ---
    const users = await getUsers();
    const existingUser = users.find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
    if (existingUser) {
      console.warn(
        `API Route: Registration attempt with existing email: ${email}`
      );
      return NextResponse.json(
        { message: "Email address already registered." },
        { status: 409 }
      ); // Conflict
    }

    // --- Prepare User Data ---
    const userId = uuidv4();
    const newUser: User = {
      id: userId,
      name: name,
      email: email,
      age: parseInt(age, 10), // Ensure age is a number
      address: address,
      bankAccountNumber: bankAccount,
      accountBalance: 10000, // Initial mock balance in INR
      registeredAt: new Date().toISOString(),
      faceImagesCaptured: true, // Mark as captured
    };

    // --- Save Face Images ---
    await ensureUserImagesDirExists(); // Make sure base dir exists
    const userImagePath = path.join(USER_IMAGES_BASE_PATH, userId);
    await fs.mkdir(userImagePath); // Create directory for this user's images

    console.log(
      `API Route: Saving ${images.length} images for user ${userId} to ${userImagePath}`
    );

    for (let i = 0; i < images.length; i++) {
      const base64Data = images[i].replace(/^data:image\/jpeg;base64,/, ""); // Remove prefix
      const imageBuffer = Buffer.from(base64Data, "base64");
      const imageFileName = `${i + 1}.jpeg`; // Name images 1.jpeg, 2.jpeg, ...
      const imageFilePath = path.join(userImagePath, imageFileName);

      try {
        await fs.writeFile(imageFilePath, imageBuffer);
        console.log(
          `API Route: Saved image ${imageFileName} for user ${userId}`
        );
      } catch (writeError) {
        console.error(
          `API Route: Failed to write image ${imageFileName} for user ${userId}`,
          writeError
        );
        // Optional: Implement cleanup logic - remove already saved images for this user if one fails?
        // For simplicity now, we'll just throw the error.
        throw new Error(`Failed to save image ${i + 1}`);
      }
    }

    // --- Save User Record ---
    users.push(newUser);
    await saveUsers(users);
    console.log(
      `API Route: User ${userId} (${email}) registered successfully.`
    );

    // --- Return Success Response ---
    // Don't send back sensitive info like balance or full user list
    return NextResponse.json(
      { message: "Registration successful!", userId: userId },
      { status: 201 }
    ); // Created
  } catch (error: any) {
    console.error("API Route: Error during registration:", error);
    // Distinguish between known errors (like file write) and generic errors
    const message =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred during registration.";
    const status = message.startsWith("Failed to save image")
      ? 500
      : error.status || 500; // Use existing status or default to 500
    return NextResponse.json({ message: message }, { status: status });
  }
}
