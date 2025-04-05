// app/api/requests/submit/route.ts
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getUsers, getRequests, saveRequests } from "@/lib/data-utils"; // Adjust path if needed
import { Request as LoanRequest } from "@/lib/types"; // Rename imported Request type to avoid conflict

// Define constants for approval logic
const APPROVAL_THRESHOLD_PERCENT = 0.8; // 80%

export async function POST(request: Request) {
  console.log("API Submit Request: Received request.");

  try {
    const body = await request.json();
    console.log("API Submit Request: Body:", body);

    // --- Input Validation ---
    const { userId, type, title, category, amount, details } = body;

    if (
      !userId ||
      !type ||
      (type === "loan" && (!title || !category)) ||
      !amount ||
      !details
    ) {
      console.error("API Submit Request: Invalid request data received.", body);
      return NextResponse.json(
        { message: "Missing required fields." },
        { status: 400 }
      );
    }

    if (type !== "loan" && type !== "deposit") {
      return NextResponse.json(
        { message: "Invalid request type." },
        { status: 400 }
      );
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ message: "Invalid amount." }, { status: 400 });
    }

    // --- Check if User Exists ---
    const users = await getUsers();
    const requestingUser = users.find((u) => u.id === userId);
    if (!requestingUser) {
      console.warn(`API Submit Request: User ID ${userId} not found.`);
      // In a real app with auth, this check would be more robust
      return NextResponse.json(
        { message: "Requesting user not found." },
        { status: 404 }
      );
    }

    // --- Calculate Votes Required ---
    const totalUsers = users.length;
    // Require votes from others, so subtract the requester if totalUsers > 1
    const votersRequiredForApproval =
      totalUsers > 1
        ? Math.ceil((totalUsers - 1) * APPROVAL_THRESHOLD_PERCENT)
        : 0; // Auto-approve if only one user? Or require 1? Let's require 0 for now if only 1 user.

    console.log(
      `API Submit Request: Total Users=${totalUsers}, Voters Required for Approval=${votersRequiredForApproval}`
    );

    // --- Create New Request Object ---
    const requestId = uuidv4();
    const newRequest: LoanRequest = {
      // Use the imported LoanRequest type
      id: requestId,
      userId: userId,
      type: type,
      // Only include loan-specific fields if type is 'loan'
      ...(type === "loan" && { title: title, category: category }),
      amount: numericAmount,
      details: details,
      status: "pending",
      createdAt: new Date().toISOString(),
      votesRequired: votersRequiredForApproval, // Store the calculated number
      approvedBy: [], // Initialize as empty arrays
      rejectedBy: [],
      // processedAt will be set when approved/rejected
    };

    // --- Save Request ---
    const allRequests = await getRequests();
    allRequests.push(newRequest);
    await saveRequests(allRequests);

    console.log(
      `API Submit Request: ${type} request ${requestId} created successfully for user ${userId}.`
    );

    // --- Return Success Response ---
    return NextResponse.json(
      {
        message: `${
          type.charAt(0).toUpperCase() + type.slice(1)
        } request submitted successfully!`,
        requestId: requestId,
      },
      { status: 201 }
    ); // Created
  } catch (error: any) {
    console.error("API Submit Request: Error processing request:", error);
    return NextResponse.json(
      { message: error.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
