import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client for background tasks
// Note: Using service role key if available for server-side operations
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
    try {
        const payload = await request.json();
        const { message } = payload;

        if (!message) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        const eventType = message.type;
        const callData = message.call || {};
        const vapiCallId = callData.id;

        // 1. Log the raw event for audit/debugging
        const { error: logError } = await supabaseAdmin
            .from('webhook_events')
            .insert({
                vapi_event_id: message.timestamp, // Vapi doesn't always provide a unique message ID per event, using timestamp as proxy or generate one
                event_type: eventType,
                payload: payload,
            });

        if (logError) {
            console.error('Error logging webhook event:', logError);
        }

        // 2. Identify the Client
        // We assume the clientId is passed in the URL or can be derived from the assistantId
        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get('clientId');

        if (!clientId && eventType !== 'test') {
            console.warn('Webhook received without clientId');
            // We could try to find client_id by assistant_id here if needed
        }

        // 3. Handle specific events
        switch (eventType) {
            case 'call.started':
                await handleCallStarted(callData, clientId);
                break;
            case 'call.completed':
                await handleCallCompleted(callData, clientId);
                break;
            case 'call.failed':
                await handleCallFailed(callData, clientId);
                break;
            case 'transcript':
                await handleTranscriptUpdate(callData, message.transcript, clientId);
                break;
            default:
                console.log(`Unhandled event type: ${eventType}`);
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function handleCallStarted(callData: any, clientId: string | null) {
    if (!clientId) return;

    // Upsert agent if it exists in the call data
    const assistantId = callData.assistantId;
    if (assistantId) {
        await supabaseAdmin.from('agents').upsert({
            client_id: clientId,
            vapi_id: assistantId,
            name: callData.assistant?.name || 'Unnamed Agent',
            updated_at: new Date().toISOString()
        }, { onConflict: 'client_id,vapi_id' });
    }

    const { error } = await supabaseAdmin.from('calls').upsert({
        client_id: clientId,
        vapi_call_id: callData.id,
        status: 'started',
        started_at: callData.startedAt || new Date().toISOString(),
        metadata: callData.metadata || {},
    }, { onConflict: 'vapi_call_id' });

    if (error) console.error('Error in handleCallStarted:', error);
}

async function handleCallCompleted(callData: any, clientId: string | null) {
    const { error } = await supabaseAdmin.from('calls').update({
        status: 'completed',
        duration: callData.duration || 0,
        cost: callData.cost || 0,
        recording_url: callData.recordingUrl,
        ended_at: callData.endedAt || new Date().toISOString(),
        transcript: callData.transcript,
    }).eq('vapi_call_id', callData.id);

    if (error) console.error('Error in handleCallCompleted:', error);
}

async function handleCallFailed(callData: any, clientId: string | null) {
    const { error } = await supabaseAdmin.from('calls').update({
        status: 'failed',
        metadata: { ...callData.metadata, error: callData.error || 'Unknown error' },
        ended_at: callData.endedAt || new Date().toISOString(),
    }).eq('vapi_call_id', callData.id);

    if (error) console.error('Error in handleCallFailed:', error);
}

async function handleTranscriptUpdate(callData: any, transcript: string, clientId: string | null) {
    const { error } = await supabaseAdmin.from('calls').update({
        transcript: transcript,
    }).eq('vapi_call_id', callData.id);

    if (error) console.error('Error in handleTranscriptUpdate:', error);
}
