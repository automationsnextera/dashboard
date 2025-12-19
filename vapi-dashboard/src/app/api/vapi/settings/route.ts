import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

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
        if (settings?.vapi_api_key) {
            // @ts-ignore
            return NextResponse.json({
                hasVapiKey: true,
                vapiKey: settings.vapi_api_key,
                version: "1.0.0"
            });
        }
    }

    return NextResponse.json({
        hasVapiKey: hasApiKey,
        vapiKey: null,
        version: "1.0.0"
    });
}
