import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Airtop does not support pausing sessions
  // Sessions can only be in states: awaitingCapacity, initializing, running, ended, completed, or cancelled
  return NextResponse.json(
    {
      error: "Pause operation is not supported by Airtop. Sessions cannot be paused - they must be either running or terminated."
    },
    { status: 501 }, // 501 Not Implemented
  );
}
