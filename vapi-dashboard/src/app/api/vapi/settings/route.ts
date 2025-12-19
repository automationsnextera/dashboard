import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let hasApiKey = false;

    if (user) {
        const { data: settings } = await supabase
            .from('user_settings')
            .select('vapi_api_key')
            .eq('user_id', user.id)
            .single();

        hasApiKey = !!settings?.vapi_api_key;
        // WARNING: Exposing the key to the client so it can initialize Vapi SDK.
        // Ensure this endpoint is protected (it is, by the user check above).
        return NextResponse.json({
            hasVapiKey: hasApiKey,
            vapiKey: settings?.vapi_api_key || null,
            environment: process.env.NODE_ENV || 'development',
            features: {
                analytics: true,
                callRecording: false,
                realtimeTranscripts: true
            },
            version: "1.0.0"
        });
    }

    return NextResponse.json({
        hasVapiKey: false,
        vapiKey: null,
        environment: process.env.NODE_ENV || 'development',
        features: {
            analytics: true,
            callRecording: false,
            realtimeTranscripts: true
        },
        version: "1.0.0"
    });
}
