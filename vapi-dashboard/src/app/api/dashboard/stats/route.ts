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
    const days = parseInt(searchParams.get('days') || '7');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
        // 2. Fetch Call Stats from Supabase
        let { data: calls, error } = await supabase
            .from('calls')
            .select('*')
            .eq('client_id', profile.client_id)
            .gte('created_at', startDate.toISOString())
            .order('created_at', { ascending: true });

        if (error) throw error;

        // 2b. Fallback to direct Vapi API fetch if Supabase is empty
        if (!calls || calls.length === 0) {
            console.log("Empty Supabase calls, falling back to Vapi API...");
            const { data: settings } = await supabase
                .from('user_settings')
                .select('vapi_api_key')
                .eq('user_id', user.id)
                .single();

            const apiKey = settings?.vapi_api_key;
            if (apiKey) {
                const response = await fetch(`https://api.vapi.ai/call?limit=1000&createdAtGe=${startDate.toISOString()}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    cache: 'no-store'
                });

                if (response.ok) {
                    const vapiData = await response.json();
                    const mappedCalls = (vapiData || []).map((c: any) => ({
                        id: c.id,
                        cost: c.cost || 0,
                        duration: c.durationMinutes ? c.durationMinutes * 60 : (c.duration || c.duration_seconds || (c.endedAt && c.startedAt ? (new Date(c.endedAt).getTime() - new Date(c.startedAt).getTime()) / 1000 : 0)),
                        status: c.status || 'unknown',
                        started_at: c.startedAt,
                        created_at: c.createdAt,
                        ended_at: c.endedAt,
                        transcript: c.transcript || "",
                        summary: c.summary || ""
                    }));
                    calls = mappedCalls;
                    console.log(`Fallback success: found ${mappedCalls.length} calls from Vapi.`);
                }
            }
        }

        // 3. Calculate KPIs
        const totalCalls = calls?.length || 0;
        const totalSpend = (calls || []).reduce((sum, c) => sum + (Number(c.cost) || 0), 0);
        // Support both duration and duration_seconds
        const totalDuration = (calls || []).reduce((sum, c) => sum + (c.duration || c.duration_seconds || 0), 0);
        const avgDuration = totalCalls > 0 ? totalDuration / totalCalls : 0;
        const successCount = (calls || []).filter(c => c.status === 'completed' || c.status === 'ended' || c.status === 'success').length;
        const successRate = totalCalls > 0 ? (successCount / totalCalls) * 100 : 0;

        // 4. Prepare Chart Data (Calls per day)
        const callsPerDay: Record<string, number> = {};
        const spendPerDay: Record<string, number> = {};

        // Initialize placeholders for all days in range
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString('en-US');
            callsPerDay[dateStr] = 0;
            spendPerDay[dateStr] = 0;
        }

        (calls || []).forEach(call => {
            const timestamp = call.started_at || call.created_at;
            if (timestamp) {
                const dateStr = new Date(timestamp).toLocaleDateString('en-US');
                if (callsPerDay[dateStr] !== undefined) {
                    callsPerDay[dateStr]++;
                    spendPerDay[dateStr] += Number(call.cost) || 0;
                }
            }
        });


        const chartData = Object.keys(callsPerDay)
            .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
            .map(date => ({
                date,
                calls: callsPerDay[date],
                spend: spendPerDay[date].toFixed(2)
            }));

        // 5. Status Distribution (Pie Chart)
        const statusCounts = (calls || []).reduce((acc, c) => {
            const s = c.status || 'unknown';
            acc[s] = (acc[s] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const pieData = Object.keys(statusCounts).map(s => ({
            name: s,
            value: statusCounts[s]
        }));

        return NextResponse.json({
            kpis: {
                totalCalls,
                totalSpend,
                avgDuration,
                successRate
            },
            chartData,
            pieData,
            recentCalls: (calls || []).slice(-5).reverse()
        });
    } catch (error: any) {
        console.error('Stats error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
