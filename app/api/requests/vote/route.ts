import { NextResponse } from "next/server";
import {
  getUsers,
  getRequests,
  saveRequests,
  getGlobalState,
  saveGlobalState,
  saveUsers,
  logTransaction,
} from "@/lib/data-utils";
import { User, Request as LoanRequest } from "@/lib/types";

// Define constants
const APPROVAL_THRESHOLD_PERCENT = 0.8; // 80% approval needed
const REJECTION_THRESHOLD_PERCENT = 0.2; // 20% rejection needed

// Helper: Calculate required votes (potential voters = total users - requester)
const calculateVotesRequired = (totalUsers: number): number => {
  const potentialVoters = totalUsers > 1 ? totalUsers - 1 : 0;
  return potentialVoters > 0
    ? Math.ceil(potentialVoters * APPROVAL_THRESHOLD_PERCENT)
    : 0;
};

// Helper: Calculate votes needed for rejection
const calculateRejectionVotesNeeded = (totalUsers: number): number => {
  const potentialVoters = totalUsers > 1 ? totalUsers - 1 : 0;
  return potentialVoters > 0
    ? Math.ceil(potentialVoters * REJECTION_THRESHOLD_PERCENT)
    : 0;
};

export async function POST(request: Request) {
  console.log("API Vote: Received vote request.");
  let responseMessage = "Vote submitted successfully."; // Default success message

  try {
    const body = await request.json();
    const { requestId, voteType, voterId } = body;

    // --- Validation ---
    if (
      !requestId ||
      !voterId ||
      (voteType !== "approve" && voteType !== "reject")
    ) {
      return NextResponse.json(
        { message: "Missing required fields: requestId, voterId, voteType." },
        { status: 400 }
      );
    }
    console.log(
      `API Vote: Data - ReqID: ${requestId}, VoterID: ${voterId}, Vote: ${voteType}`
    );

    // --- Fetch Data Concurrently ---
    const [allRequests, allUsers, globalState] = await Promise.all([
      getRequests(),
      getUsers(),
      getGlobalState(),
    ]);

    // --- Find Request, Voter, and Requester ---
    const requestIndex = allRequests.findIndex(
      (req: LoanRequest) => req.id === requestId
    );
    if (requestIndex === -1)
      return NextResponse.json(
        { message: "Request not found." },
        { status: 404 }
      );
    const targetRequest = allRequests[requestIndex];

    const voterIndex = allUsers.findIndex((u) => u.id === voterId);
    if (voterIndex === -1)
      return NextResponse.json(
        { message: "Voter not found." },
        { status: 404 }
      );
    const voter = allUsers[voterIndex];

    const requesterIndex = allUsers.findIndex(
      (u) => u.id === targetRequest.userId
    );
    if (requesterIndex === -1) {
      console.error(
        `API Vote: CRITICAL - Requester ${targetRequest.userId} for request ${requestId} not found!`
      );
      return NextResponse.json(
        { message: "Requester account not found." },
        { status: 404 }
      );
    }
    const requester = allUsers[requesterIndex];

    // --- Voting Logic Checks ---
    if (targetRequest.status !== "pending")
      return NextResponse.json(
        { message: "Request is no longer pending." },
        { status: 400 }
      );
    if (targetRequest.userId === voterId)
      return NextResponse.json(
        { message: "Cannot vote on your own request." },
        { status: 403 }
      );
    if (
      targetRequest.approvedBy.includes(voterId) ||
      targetRequest.rejectedBy.includes(voterId)
    ) {
      return NextResponse.json({ message: "Already voted." }, { status: 409 });
    }

    // --- Apply Vote ---
    if (voteType === "approve") {
      targetRequest.approvedBy.push(voterId);
    } else {
      targetRequest.rejectedBy.push(voterId);
    }
    console.log(
      `API Vote: Vote applied. Approvals: ${targetRequest.approvedBy.length}, Rejections: ${targetRequest.rejectedBy.length}`
    );

    // --- Check Thresholds and Process Request ---
    const currentApprovals = targetRequest.approvedBy.length;
    const currentRejections = targetRequest.rejectedBy.length;
    const totalUsers = allUsers.length;
    const requiredApprovalVotes = calculateVotesRequired(totalUsers);
    const requiredRejectionVotes = calculateRejectionVotesNeeded(totalUsers);
    let needsSave = true;
    let transactionSuccess = false;

    console.log(
      `API Vote: Thresholds - Approve: ${requiredApprovalVotes}, Reject: ${requiredRejectionVotes}`
    );

    // Check for Approval
    if (
      requiredApprovalVotes > 0 &&
      currentApprovals >= requiredApprovalVotes
    ) {
      console.log(
        `API Vote: Approval threshold met for Request ${requestId}. Processing...`
      );
      targetRequest.status = "approved";
      targetRequest.processedAt = new Date().toISOString();
      responseMessage = `Vote submitted. Request status updated to APPROVED.`;

      if (targetRequest.type === "loan") {
        // Modify the user's balance (increase for loan)
        const previousUserBalance = requester.accountBalance;
        requester.accountBalance += targetRequest.amount;

        // Modify the global fund (decrease for loan)
        const previousGlobalBalance = globalState.totalFund;
        globalState.totalFund -= targetRequest.amount;

        console.log(
          `API Vote: Loan approved. User ${requester.id} balance updated from ${previousUserBalance} to ${requester.accountBalance}.`
        );
        console.log(
          `API Vote: Global fund updated from ${previousGlobalBalance} to ${globalState.totalFund}.`
        );

        transactionSuccess = true;
      } else {
        // Deposit
        if (requester.accountBalance >= targetRequest.amount) {
          // Modify the user's balance (decrease for deposit)
          const previousUserBalance = requester.accountBalance;
          requester.accountBalance -= targetRequest.amount;

          // Modify the global fund (increase for deposit)
          const previousGlobalBalance = globalState.totalFund;
          globalState.totalFund += targetRequest.amount;

          console.log(
            `API Vote: Deposit approved. User ${requester.id} balance updated from ${previousUserBalance} to ${requester.accountBalance}.`
          );
          console.log(
            `API Vote: Global fund updated from ${previousGlobalBalance} to ${globalState.totalFund}.`
          );

          transactionSuccess = true;
        } else {
          console.warn(
            `API Vote: Deposit ${requestId} failed - insufficient funds for ${requester.id}. Rejecting.`
          );
          targetRequest.status = "rejected"; // Override status
          responseMessage = `Vote submitted. Deposit REJECTED due to insufficient funds.`;
          transactionSuccess = false;
        }
      }

      // Log the transaction for history
      await logTransaction(
        targetRequest.id,
        targetRequest.type,
        requester.id,
        targetRequest.amount,
        transactionSuccess
      );
    } else if (
      requiredRejectionVotes > 0 &&
      currentRejections >= requiredRejectionVotes
    ) {
      console.log(
        `API Vote: Rejection threshold met for Request ${requestId}.`
      );
      targetRequest.status = "rejected";
      targetRequest.processedAt = new Date().toISOString();
      responseMessage = `Vote submitted. Request status updated to REJECTED.`;

      // Log the rejected transaction
      await logTransaction(
        targetRequest.id,
        targetRequest.type,
        requester.id,
        targetRequest.amount,
        false // Not successful because rejected
      );
    } else {
      console.log(
        `API Vote: Thresholds not met for Request ${requestId}. Vote recorded.`
      );
    }

    // --- Save Updated Data ---
    if (needsSave) {
      // Update the specific request in the array (DON'T REMOVE IT)
      allRequests[requestIndex] = targetRequest;

      // Update the user in the array if balance changed
      if (targetRequest.status === "approved") {
        allUsers[requesterIndex] = requester;
      }

      // Save all data concurrently
      await Promise.all([
        saveRequests(allRequests),
        saveUsers(allUsers),
        saveGlobalState(globalState),
      ]);
      console.log("API Vote: Data saved successfully.");
    }

    return NextResponse.json(
      {
        message: responseMessage,
        newStatus: targetRequest.status,
        globalFund: globalState.totalFund, // Return updated global fund for UI refresh
        userBalance: requester.accountBalance, // Return updated user balance
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("API Vote: Error processing vote:", error);
    return NextResponse.json(
      {
        message: error.message || "An unexpected error occurred during voting.",
      },
      { status: 500 }
    );
  }
}
