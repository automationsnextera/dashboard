import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Get User Profile and Client ID
    const { data: profile } = await supabase
        .from('profiles')
        .select('client_id')
        .eq('id', user.id)
        .single();

    if (!profile?.client_id) {
        return NextResponse.json({ error: 'Incomplete profile - client_id missing' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const agentId = searchParams.get('agentId');
    const search = searchParams.get('search');

    // Calculate offset
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    try {
        let query = supabase
            .from('calls')
            .select('*, agents(name)', { count: 'exact' })
            .eq('client_id', profile.client_id)
            .order('started_at', { ascending: false })
            .range(from, to);

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        if (agentId && agentId !== 'all') {
            query = query.eq('agent_id', agentId);
        }

        if (search) {
            // Simple search in transcript or metadata
            query = query.or(`transcript.ilike.%${search}%,status.ilike.%${search}%`);
        }

        let { data, error, count } = await query;

        if (error) throw error;

        // Fallback to Vapi if empty
        if ((!data || data.length === 0) && page === 1) {
            const { data: settings } = await supabase
                .from('user_settings')
                .select('vapi_api_key')
                .eq('user_id', user.id)
                .single();

            const apiKey = settings?.vapi_api_key;
            if (apiKey) {
                const response = await fetch(`https://api.vapi.ai/call?limit=${limit}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    cache: 'no-store'
                });

                if (response.ok) {
                    const vapiData = await response.json();
                    data = (vapiData || []).map((c: any) => ({
                        id: c.id,
                        vapi_call_id: c.id,
                        status: c.status || 'unknown',
                        started_at: c.startedAt,
                        ended_at: c.endedAt,
                        duration: c.durationMinutes ? c.durationMinutes * 60 : 0,
                        cost: c.cost || 0,
                        transcript: c.transcript || "",
                        agents: { name: c.assistant?.name || 'Vapi Agent' }
                    }));
                    count = data.length;
                }
            }
        }

        return NextResponse.json({
            data,
            pagination: {
                total: count,
                page,
                limit,
                totalPages: Math.ceil((count || 0) / limit)
            }
        });
    } catch (error: any) {
        console.error('Calls API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
