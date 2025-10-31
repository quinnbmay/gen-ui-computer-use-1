import { NextRequest, NextResponse } from "next/server";
import { AirtopClient } from "@airtop/sdk";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { instanceId } = body as { instanceId: string };

    if (!instanceId) {
      return NextResponse.json(
        { error: "`instanceId` is required." },
        { status: 400 },
      );
    }

    if (!process.env.AIRTOP_API_KEY) {
      return NextResponse.json(
        {
          error: "Airtop API key is missing",
        },
        { status: 400 },
      );
    }

    const client = new AirtopClient({
      apiKey: process.env.AIRTOP_API_KEY,
    });

    await client.sessions.terminate(instanceId);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Failed to terminate session:", error);

    return NextResponse.json(
      { error: "Failed to terminate session: " + error.message },
      { status: 500 },
    );
  }
}
