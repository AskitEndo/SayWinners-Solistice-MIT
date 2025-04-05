import { NextResponse } from "next/server";
import { getUsers, getRequests } from "@/lib/data-utils";

export async function GET(request: Request) {
  try {
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId"); // Optional filter by user
    const status = searchParams.get("status"); // Optional filter by status
    const type = searchParams.get("type"); // Optional filter by type

    // Get all users and requests
    const [users, requests] = await Promise.all([getUsers(), getRequests()]);

    // Filter requests based on parameters
    let filteredRequests = [...requests]; // Clone the array

    if (userId) {
      filteredRequests = filteredRequests.filter(
        (req) => req.userId === userId
      );
    }

    if (status && ["pending", "approved", "rejected"].includes(status)) {
      filteredRequests = filteredRequests.filter(
        (req) => req.status === status
      );
    }

    if (type && ["loan", "deposit"].includes(type)) {
      filteredRequests = filteredRequests.filter((req) => req.type === type);
    }

    // Sort by most recent first
    filteredRequests.sort((a, b) => {
      const dateA = a.processedAt
        ? new Date(a.processedAt)
        : new Date(a.createdAt);
      const dateB = b.processedAt
        ? new Date(b.processedAt)
        : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });

    // Enhance requests with requester name
    const enhancedRequests = filteredRequests.map((req) => {
      const requester = users.find((user) => user.id === req.userId);
      return {
        ...req,
        requesterName: requester ? requester.name : "Unknown User",
      };
    });

    console.log(
      `API: Returning ${enhancedRequests.length} request history records`
    );
    return NextResponse.json(enhancedRequests);
  } catch (error) {
    console.error("API Error in request history:", error);
    return NextResponse.json(
      { message: "Failed to fetch request history" },
      { status: 500 }
    );
  }
}
