import { NextResponse } from "next/server";
import { getUsers, getRequests } from "@/lib/data-utils";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    if (!id) {
      return NextResponse.json(
        { message: "Request ID is required" },
        { status: 400 }
      );
    }

    // Get all requests and users
    const [requests, users] = await Promise.all([getRequests(), getUsers()]);

    // Find the specific request
    const targetRequest = requests.find((req) => req.id === id);

    if (!targetRequest) {
      return NextResponse.json(
        { message: "Request not found" },
        { status: 404 }
      );
    }

    // Get requester information
    const requester = users.find((user) => user.id === targetRequest.userId);

    // Get information about voters
    const approvers = targetRequest.approvedBy.map((approverId) => {
      const user = users.find((u) => u.id === approverId);
      return user
        ? { id: user.id, name: user.name }
        : { id: approverId, name: "Unknown User" };
    });

    const rejectors = targetRequest.rejectedBy.map((rejectorId) => {
      const user = users.find((u) => u.id === rejectorId);
      return user
        ? { id: user.id, name: user.name }
        : { id: rejectorId, name: "Unknown User" };
    });

    // Return enhanced request with voter details
    return NextResponse.json({
      ...targetRequest,
      requester: requester
        ? {
            id: requester.id,
            name: requester.name,
            email: requester.email,
          }
        : null,
      approvers,
      rejectors,
    });
  } catch (error) {
    console.error("API Error getting request detail:", error);
    return NextResponse.json(
      { message: "Failed to fetch request details" },
      { status: 500 }
    );
  }
}
