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
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
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

        const { data, error, count } = await query;

        if (error) throw error;

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
