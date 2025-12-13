import { NextResponse } from 'next/server';

export async function GET() {
    const apiKey = process.env.VAPI_PRIVATE_KEY ?? process.env.VAPI_API_KEY;

    if (!apiKey) {
        return NextResponse.json(
            { error: 'Server Configuration Error: Missing VAPI Key' },
            { status: 500 }
        );
    }

    try {
        const response = await fetch('https://api.vapi.ai/call', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("VAPI API Error:", errorText);
            return NextResponse.json({ error: `VAPI Error: ${errorText}` }, { status: response.status });
        }

        const data = await response.json();

        // Map/Sanitize data
        const mappedCalls = data.map((call: any) => ({
            id: call.id,
            status: call.status,
            startedAt: call.startedAt,
            endedAt: call.endedAt,
            duration: call.durationMinutes ? call.durationMinutes * 60 : 0, // Approx if seconds not provided, or check specific fields
            cost: call.cost ?? 0,
            assistantId: call.assistantId,
            assistant: call.assistant, // This might contain sensitive info? Usually it is just config.
            phoneNumber: call.phoneNumber,
            type: call.type,
            transcript: call.transcript,
            summary: call.summary,
        }));

        return NextResponse.json(mappedCalls);
    } catch (error: any) {
        console.error('Error fetching VAPI calls:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
