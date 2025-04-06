// app/api/requests/submit/route.ts
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import {
  getUsers,
  getRequests,
  saveRequests,
  logTransaction,
  getGlobalState,
  saveGlobalState,
} from "@/lib/data-utils";
import {
  sendNewRequestNotification,
  sendNewVotingRequestNotification,
  sendRequestStatusUpdateNotification,
  sendVoteReceivedNotification,
} from "@/lib/email-utils";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { userId, type, title, category, amount, details } = data;

    // Input validation
    if (!userId || !type || !amount || !details) {
      return NextResponse.json(
        { error: "Required fields missing" },
        { status: 400 }
      );
    }

    // Get all users and requests
    const users = await getUsers();
    const requests = await getRequests();

    // Find the requesting user
    const requestingUser = users.find((user) => user.id === userId);
    if (!requestingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate votes required (80% of all users excluding requester)
    const eligibleVoters = users.length - 1; // exclude requester
    const votesRequired = Math.ceil(eligibleVoters * 0.8);

    // Create new request
    const requestId = uuidv4();
    const newRequest = {
      id: requestId,
      userId,
      type,
      title: type === "loan" ? title : undefined,
      category: type === "loan" ? category : undefined,
      amount: Number(amount),
      details,
      status: "pending",
      createdAt: new Date().toISOString(),
      votesRequired,
      approvedBy: [],
      rejectedBy: [],
    };

    // Save the request
    requests.push(newRequest);
    await saveRequests(requests);

    // Send email notifications
    try {
      // 1. Send notification to requester
      await sendNewRequestNotification(requestingUser, newRequest);
      console.log(`Request notification sent to ${requestingUser.email}`);

      // 2. Send notifications to other users for voting
      const otherUsers = users.filter((user) => user.id !== userId);
      for (const user of otherUsers) {
        await sendNewVotingRequestNotification(
          user,
          newRequest,
          requestingUser.name
        );
      }
      console.log(`Voting notifications sent to ${otherUsers.length} users`);
    } catch (emailError) {
      console.error("Error sending email notifications:", emailError);
      // Continue with request creation even if emails fail
    }

    return NextResponse.json({
      success: true,
      request: newRequest,
    });
  } catch (error) {
    console.error("Request submission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
