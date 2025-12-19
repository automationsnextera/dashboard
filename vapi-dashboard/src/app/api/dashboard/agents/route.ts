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
        .select('client_id')
        .eq('id', user.id)
        .single();

    if (!profile?.client_id) {
        return NextResponse.json({ error: 'Incomplete profile - client_id missing' }, { status: 400 });
    }

    try {
        // 1. Fetch Agents
        const { data: agents, error: agentsError } = await supabase
            .from('agents')
            .select('*')
            .eq('client_id', profile.client_id);

        if (agentsError) throw agentsError;

        // 2. Fetch Call Stats per Agent
        const { data: stats, error: statsError } = await supabase
            .from('calls')
            .select('agent_id, status, duration, cost')
            .eq('client_id', profile.client_id);

        if (statsError) throw statsError;

        // 3. Aggregate data
        const agentMetrics = agents.map(agent => {
            const agentCalls = stats.filter(c => c.agent_id === agent.id);
            const totalCalls = agentCalls.length;
            const totalCost = agentCalls.reduce((sum, c) => sum + (Number(c.cost) || 0), 0);
            const totalDuration = agentCalls.reduce((sum, c) => sum + (c.duration || 0), 0);
            const successCount = agentCalls.filter(c => c.status === 'completed').length;

            return {
                ...agent,
                metrics: {
                    totalCalls,
                    totalCost,
                    avgDuration: totalCalls > 0 ? totalDuration / totalCalls : 0,
                    successRate: totalCalls > 0 ? (successCount / totalCalls) * 100 : 0
                }
            };
        });

        return NextResponse.json(agentMetrics);
    } catch (error: any) {
        console.error('Agents API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
