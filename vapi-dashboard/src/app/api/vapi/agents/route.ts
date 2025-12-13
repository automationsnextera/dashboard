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
        const response = await fetch('https://api.vapi.ai/assistant', {
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

        const mappedAgents = data.map((agent: any) => ({
            id: agent.id,
            name: agent.name || "Unnamed Agent",
            model: agent.model?.model || "Unknown Model",
            voice: agent.voice?.voiceId || "Default Voice",
            systemPrompt: agent.model?.messages?.find((m: any) => m.role === 'system')?.content || "No system prompt",
            updatedAt: agent.updatedAt,
            createdAt: agent.createdAt
        }));

        return NextResponse.json(mappedAgents);
    } catch (error: any) {
        console.error('Error fetching VAPI agents:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
