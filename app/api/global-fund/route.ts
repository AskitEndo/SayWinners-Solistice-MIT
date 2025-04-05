import { NextResponse } from "next/server";
import { getGlobalState } from "@/lib/data-utils";

export async function GET() {
  try {
    const globalState = await getGlobalState();

    return NextResponse.json({
      totalFund: globalState.totalFund,
      lastUpdated: globalState.lastUpdated,
    });
  } catch (error) {
    console.error("API Error fetching global fund:", error);
    return NextResponse.json(
      { message: "Failed to fetch global fund data" },
      { status: 500 }
    );
  }
}
