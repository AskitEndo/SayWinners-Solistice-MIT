// app/api/requests/pending/route.ts
import { NextResponse } from "next/server";
import { getRequests, getUsers } from "@/lib/data-utils";
import { User, Request as LoanRequest } from "@/lib/types";

// Define the structure of the response object, including user name
interface PendingRequestResponse extends LoanRequest {
  requesterName: string; // Add the requester's name
}

export async function GET() {
  console.log("API Pending Requests: Received GET request.");
  try {
    const [requests, users] = await Promise.all([getRequests(), getUsers()]);

    // Create a quick lookup map for user names
    const userMap = new Map<string, string>();
    users.forEach((user) => userMap.set(user.id, user.name));

    // Filter for pending requests and add requester's name
    const pendingRequests: PendingRequestResponse[] = requests
      .filter((req) => req.status === "pending")
      .map((req) => ({
        ...req,
        // Add requester name, default to 'Unknown User' if not found (shouldn't happen ideally)
        requesterName: userMap.get(req.userId) || "Unknown User",
      }));

    console.log(
      `API Pending Requests: Found ${pendingRequests.length} pending requests.`
    );

    return NextResponse.json(pendingRequests, { status: 200 });
  } catch (error: any) {
    console.error(
      "API Pending Requests: Error fetching pending requests:",
      error
    );
    return NextResponse.json(
      { message: error.message || "Failed to fetch pending requests." },
      { status: 500 }
    );
  }
}
