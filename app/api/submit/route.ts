// app/api/requests/submit/route.ts
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getUsers, getRequests, saveRequests } from "@/lib/data-utils"; // Ensure this path is correct
import { User, Request as LoanRequest, RequestType } from "@/lib/types"; // Use LoanRequest alias, import RequestType

// Define constants for approval logic (can be adjusted later)
const APPROVAL_THRESHOLD_PERCENT = 0.1; // 80%

// Helper function to calculate required votes
const calculateVotesRequired = (
  totalUsers: number,
  requesterId: string
): number => {
  // Filter out the requester themselves before calculation
  const potentialVoters = totalUsers > 1 ? totalUsers - 1 : 0;
  if (potentialVoters <= 0) {
    return 0; // No votes needed if only one user or somehow zero
  }
  // Calculate 80% of potential voters, rounding up
  return Math.ceil(potentialVoters * APPROVAL_THRESHOLD_PERCENT);
};

export async function POST(request: Request) {
  console.log("API Submit Request: Received request.");

  try {
    const body = await request.json();
    console.log("API Submit Request: Received Body:", body);

    // --- Destructure and Validate Common Fields ---
    const { userId, type, amount, details } = body;
    const requestType = type as RequestType; // Assert the type

    if (!userId || !requestType || !amount || !details) {
      console.error("API Submit Request: Missing common required fields.", {
        userId,
        type,
        amount,
        details,
      });
      return NextResponse.json(
        { message: "Missing required fields (userId, type, amount, details)." },
        { status: 400 }
      );
    }

    if (requestType !== "loan" && requestType !== "deposit") {
      return NextResponse.json(
        { message: 'Invalid request type. Must be "loan" or "deposit".' },
        { status: 400 }
      );
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { message: "Invalid amount. Must be a positive number." },
        { status: 400 }
      );
    }

    // --- Validate Loan-Specific Fields ---
    let loanTitle: string | undefined = undefined;
    let loanCategory: string | undefined = undefined;
    if (requestType === "loan") {
      loanTitle = body.title;
      loanCategory = body.category;
      if (!loanTitle || !loanCategory) {
        console.error(
          "API Submit Request: Missing required fields for loan request.",
          { title: loanTitle, category: loanCategory }
        );
        return NextResponse.json(
          {
            message:
              "Missing required fields (title, category) for loan request.",
          },
          { status: 400 }
        );
      }
    }

    // --- Check if Requesting User Exists ---
    const users = await getUsers();
    const requestingUser = users.find((u) => u.id === userId);
    if (!requestingUser) {
      console.warn(
        `API Submit Request: Requesting User ID ${userId} not found.`
      );
      // In a real app with server-side auth, you'd get the user ID from the session/token
      return NextResponse.json(
        { message: "Requesting user not found." },
        { status: 404 }
      );
    }
    console.log(
      `API Submit Request: Requesting user ${requestingUser.name} (${userId}) found.`
    );

    // --- Calculate Votes Required ---
    const totalUsers = users.length;
    const votesRequired = calculateVotesRequired(totalUsers, userId);
    console.log(
      `API Submit Request: Total Users=${totalUsers}, Votes Required for Approval=${votesRequired}`
    );

    // --- Create New Request Object ---
    const requestId = uuidv4();
    const newRequest: LoanRequest = {
      id: requestId,
      userId: userId,
      type: requestType, // Use validated type
      // Include loan fields conditionally
      ...(requestType === "loan" && {
        title: loanTitle,
        category: loanCategory,
      }),
      amount: numericAmount,
      details: details,
      status: "pending",
      createdAt: new Date().toISOString(),
      votesRequired: votesRequired, // Store the calculated number
      approvedBy: [], // Initialize vote arrays
      rejectedBy: [],
      processedAt: undefined, // Not processed yet
    };

    // --- Save the New Request ---
    const allRequests = await getRequests();
    allRequests.push(newRequest);
    await saveRequests(allRequests);

    console.log(
      `API Submit Request: ${requestType.toUpperCase()} request ${requestId} created successfully for user ${userId}.`
    );

    // --- Return Success Response ---
    // Capitalize type for the message
    const typeDisplay =
      requestType.charAt(0).toUpperCase() + requestType.slice(1);
    return NextResponse.json(
      {
        message: `${typeDisplay} request submitted successfully!`,
        requestId: requestId,
        requestDetails: newRequest, // Send back the created request object
      },
      { status: 201 }
    ); // 201 Created
  } catch (error: any) {
    console.error("API Submit Request: Error processing request:", error);
    // Check for JSON parsing errors specifically
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: "Invalid JSON format in request body." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: error.message || "An unexpected server error occurred." },
      { status: 500 }
    );
  }
}
