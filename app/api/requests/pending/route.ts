// app/api/requests/pending/route.ts
import { NextResponse } from "next/server";
import { getUsers, getRequests } from "@/lib/data-utils";

export async function GET() {
  try {
    // Get all users and requests
    const [users, requests] = await Promise.all([getUsers(), getRequests()]);

    // Filter to only pending requests
    const pendingRequests = requests.filter((req) => req.status === "pending");

    // Enhance requests with requester name
    const enhancedRequests = pendingRequests.map((req) => {
      const requester = users.find((user) => user.id === req.userId);
      return {
        ...req,
        requesterName: requester ? requester.name : "Unknown User",
      };
    });

    console.log(`API: Returning ${enhancedRequests.length} pending requests`);
    return NextResponse.json(enhancedRequests);
  } catch (error) {
    console.error("API Error in pending requests:", error);
    return NextResponse.json(
      { message: "Failed to fetch pending requests" },
      { status: 500 }
    );
  }
}
