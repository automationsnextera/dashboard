import { NextResponse, NextRequest } from "next/server";
import { inngest } from "@/inngest/client";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const headers = req.headers;
        const vapiSecret = headers.get("x-vapi-secret");

        // 1. Verify Secret
        if (vapiSecret !== process.env.VAPI_WEBHOOK_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Push to Inngest (Async processing)
        // const { message } = body; // Unused


        // NOTE: Check Vapi docs. Payload might be the body itself.
        // Assuming body IS the payload for now.
        // Vapi events: type, call, etc.

        await inngest.send({
            name: "vapi/call.event",
            data: body, // Send raw body
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
