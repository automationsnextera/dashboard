import { NextResponse } from 'next/server';

export async function GET() {
    console.log("----------------------------------------");
    console.log("1. API Route /api/vapi/stats hit");

    // CHECK 1: Is the API Key loaded?
    const apiKey = process.env.VAPI_API_KEY;

    if (!apiKey) {
        console.error("❌ ERROR: VAPI_API_KEY is undefined. Check your .env.local file and restart server.");
        return NextResponse.json({ error: "Server Configuration Error: Missing API Key" }, { status: 500 });
    }

    console.log("2. API Key found (starts with):", apiKey.substring(0, 4) + "...");

    try {
        console.log("3. Sending request to Vapi...");
        const response = await fetch('https://api.vapi.ai/call', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            cache: 'no-store'
        });

        console.log("4. Vapi Response Status:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Vapi API returned error:", errorText);
            return NextResponse.json({ error: `Vapi Error: ${errorText}` }, { status: response.status });
        }

        const data = await response.json();
        console.log(`5. Success! Fetched ${data.length} calls.`);
        return NextResponse.json(data);

    } catch (error: any) {
        console.error("❌ CRASH inside route.ts:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}