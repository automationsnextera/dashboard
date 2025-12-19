import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*, clients(*)')
        .eq('id', user.id)
        .single();

    const { data: settings } = await supabase
        .from('user_settings')
        .select('vapi_api_key')
        .eq('user_id', user.id)
        .single();

    if (!profile?.clients) {
        return NextResponse.json({ error: 'Incomplete profile - client_id missing' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const webhookUrl = `${baseUrl}/api/webhooks/vapi?clientId=${profile.client_id}`;

    return NextResponse.json({
        client: profile.clients,
        profile: {
            role: profile.role,
            fullName: profile.full_name
        },
        vapi_api_key: settings?.vapi_api_key || null,
        webhookUrl
    });
}

export async function PATCH(request: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('client_id, role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'Owner' && profile?.role !== 'Admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { name, branding, vapi_api_key } = body;

        if (name || branding) {
            const { error: clientError } = await supabase
                .from('clients')
                .update({
                    name,
                    branding,
                    updated_at: new Date().toISOString()
                })
                .eq('id', profile.client_id);

            if (clientError) throw clientError;
        }

        if (vapi_api_key !== undefined) {
            const { error: settingsError } = await supabase
                .from('user_settings')
                .upsert({
                    user_id: user.id,
                    vapi_api_key,
                    updated_at: new Date().toISOString()
                });

            if (settingsError) throw settingsError;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
