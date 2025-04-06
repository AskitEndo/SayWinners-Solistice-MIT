import { NextResponse } from "next/server";
import {
  getUsers,
  getRequests,
  saveRequests,
  getGlobalState,
  saveGlobalState,
  logTransaction,
} from "@/lib/data-utils";
import {
  sendVoteReceivedNotification,
  sendRequestStatusUpdateNotification,
  sendRequestOutcomeNotification,
} from "@/lib/email-utils";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { requestId, userId, voteType } = data;

    if (!requestId || !userId || !voteType) {
      return NextResponse.json(
        { error: "Required fields missing" },
        { status: 400 }
      );
    }

    const users = await getUsers();
    const requests = await getRequests();

    // Find the voter and the request
    const voter = users.find((user) => user.id === userId);
    const requestIndex = requests.findIndex((req) => req.id === requestId);

    if (!voter) {
      return NextResponse.json({ error: "Voter not found" }, { status: 404 });
    }

    if (requestIndex === -1) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const requestItem = requests[requestIndex];

    // Check if request is still pending
    if (requestItem.status !== "pending") {
      return NextResponse.json(
        { error: "Cannot vote on a request that is not pending" },
        { status: 400 }
      );
    }

    // Check if user has already voted
    if (
      requestItem.approvedBy.includes(userId) ||
      requestItem.rejectedBy.includes(userId)
    ) {
      return NextResponse.json(
        { error: "User has already voted on this request" },
        { status: 400 }
      );
    }

    // Check if user is voting on their own request
    if (requestItem.userId === userId) {
      return NextResponse.json(
        { error: "Users cannot vote on their own requests" },
        { status: 400 }
      );
    }

    // Record the vote
    if (voteType === "approve") {
      requestItem.approvedBy.push(userId);
    } else if (voteType === "reject") {
      requestItem.rejectedBy.push(userId);
    } else {
      return NextResponse.json({ error: "Invalid vote type" }, { status: 400 });
    }

    // Find requester for notification
    const requester = users.find((user) => user.id === requestItem.userId);
    if (!requester) {
      return NextResponse.json(
        { error: "Requester not found" },
        { status: 404 }
      );
    }

    // Send vote notification email to requester
    try {
      await sendVoteReceivedNotification(
        requester,
        requestItem,
        voter.name,
        voteType
      );
      console.log(`Vote notification sent to ${requester.email}`);
    } catch (emailError) {
      console.error("Error sending vote notification:", emailError);
    }

    // Check if request should be approved or rejected
    const totalVotes =
      requestItem.approvedBy.length + requestItem.rejectedBy.length;
    const eligibleVoters = users.length - 1; // exclude requester

    // Logic to determine if the request has received enough votes
    if (requestItem.approvedBy.length >= requestItem.votesRequired) {
      // Mark request as approved
      requestItem.status = "approved";
      requestItem.processedAt = new Date().toISOString();

      // Update balances for loan/deposit
      const globalState = await getGlobalState();

      if (requestItem.type === "loan") {
        // For loan: add money to requester, remove from global fund
        requester.accountBalance += requestItem.amount;
        globalState.totalFund -= requestItem.amount;
      } else if (requestItem.type === "deposit") {
        // For deposit: remove money from requester, add to global fund
        requester.accountBalance -= requestItem.amount;
        globalState.totalFund += requestItem.amount;
      }

      // Save updated user and global state
      await saveGlobalState(globalState);
      await saveRequests(requests);

      // Log transaction
      await logTransaction(
        requestItem.id,
        requestItem.type,
        requester.id,
        requestItem.amount,
        true
      );

      // Send status update email to requester
      try {
        await sendRequestStatusUpdateNotification(requester, requestItem);
        console.log(`Request approval notification sent to ${requester.email}`);

        // Send outcome emails to voters
        const voters = [...requestItem.approvedBy, ...requestItem.rejectedBy];
        for (const voterId of voters) {
          const voter = users.find((u) => u.id === voterId);
          if (voter && voter.id !== requester.id) {
            await sendRequestOutcomeNotification(
              voter,
              requestItem,
              requester.name
            );
          }
        }
      } catch (emailError) {
        console.error("Error sending approval emails:", emailError);
      }
    } else if (
      requestItem.rejectedBy.length >
      eligibleVoters - requestItem.votesRequired
    ) {
      // Not enough possible approving votes left to reach threshold
      requestItem.status = "rejected";
      requestItem.processedAt = new Date().toISOString();

      // Log transaction (failed)
      await logTransaction(
        requestItem.id,
        requestItem.type,
        requester.id,
        requestItem.amount,
        false
      );

      // Send status update email to requester
      try {
        await sendRequestStatusUpdateNotification(requester, requestItem);
        console.log(
          `Request rejection notification sent to ${requester.email}`
        );

        // Send outcome emails to voters
        const voters = [...requestItem.approvedBy, ...requestItem.rejectedBy];
        for (const voterId of voters) {
          const voter = users.find((u) => u.id === voterId);
          if (voter && voter.id !== requester.id) {
            await sendRequestOutcomeNotification(
              voter,
              requestItem,
              requester.name
            );
          }
        }
      } catch (emailError) {
        console.error("Error sending rejection emails:", emailError);
      }
    }

    // Save the updated requests
    await saveRequests(requests);

    return NextResponse.json({
      success: true,
      request: requestItem,
    });
  } catch (error) {
    console.error("Vote processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
