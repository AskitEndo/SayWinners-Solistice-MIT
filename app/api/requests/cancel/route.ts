import { NextResponse } from "next/server";
import { getUsers, getRequests, saveRequests } from "@/lib/data-utils";
import {
  sendRequestCancellationNotification,
  sendRequestOutcomeNotification,
} from "@/lib/email-utils";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { requestId, userId } = data;

    if (!requestId || !userId) {
      return NextResponse.json(
        { error: "Request ID and user ID are required" },
        { status: 400 }
      );
    }

    // Get users and requests
    const users = await getUsers();
    const requests = await getRequests();

    // Find the user and request
    const user = users.find((u) => u.id === userId);
    const requestIndex = requests.findIndex((r) => r.id === requestId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (requestIndex === -1) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const requestToCancel = requests[requestIndex];

    // Check if the request belongs to the user
    if (requestToCancel.userId !== userId) {
      return NextResponse.json(
        { error: "User can only cancel their own requests" },
        { status: 403 }
      );
    }

    // Check if request is still pending
    if (requestToCancel.status !== "pending") {
      return NextResponse.json(
        { error: "Only pending requests can be cancelled" },
        { status: 400 }
      );
    }

    // Mark the request as rejected (cancelled by user)
    requestToCancel.status = "rejected";
    requestToCancel.processedAt = new Date().toISOString();

    // Save changes
    await saveRequests(requests);

    // Send cancellation notification email
    try {
      await sendRequestCancellationNotification(user, requestToCancel);
      console.log(`Cancellation notification sent to ${user.email}`);

      // Notify voters that the request was cancelled
      const voters = [
        ...requestToCancel.approvedBy,
        ...requestToCancel.rejectedBy,
      ];
      for (const voterId of voters) {
        const voter = users.find((u) => u.id === voterId);
        if (voter && voter.id !== userId) {
          await sendRequestOutcomeNotification(
            voter,
            requestToCancel,
            user.name
          );
          console.log(
            `Cancellation outcome notification sent to ${voter.email}`
          );
        }
      }
    } catch (emailError) {
      console.error("Error sending cancellation emails:", emailError);
    }

    return NextResponse.json({
      success: true,
      message: "Request cancelled successfully",
    });
  } catch (error) {
    console.error("Request cancellation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
