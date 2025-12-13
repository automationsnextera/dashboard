import { NextResponse } from 'next/server';

export async function GET() {
    // In a real app, this might fetch from VAPI /account endpoint or just return safe env vars
    // For now, we will return some safe configuration status

    const hasApiKey = !!(process.env.VAPI_PRIVATE_KEY ?? process.env.VAPI_API_KEY);

    return NextResponse.json({
        environment: process.env.NODE_ENV,
        hasVapiKey: hasApiKey,
        features: {
            analytics: true,
            callRecording: true,
            realtimeTranscripts: true
        },
        version: "1.0.0"
    });
}
