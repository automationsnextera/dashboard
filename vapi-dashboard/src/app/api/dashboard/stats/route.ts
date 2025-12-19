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
    const days = parseInt(searchParams.get('days') || '7');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
        // 2. Fetch Call Stats
        const { data: calls, error } = await supabase
            .from('calls')
            .select('*')
            .eq('client_id', profile.client_id)
            .gte('started_at', startDate.toISOString())
            .order('started_at', { ascending: true });

        if (error) throw error;

        // 3. Calculate KPIs
        const totalCalls = calls.length;
        const totalSpend = calls.reduce((sum, c) => sum + (Number(c.cost) || 0), 0);
        const totalDuration = calls.reduce((sum, c) => sum + (c.duration || 0), 0);
        const avgDuration = totalCalls > 0 ? totalDuration / totalCalls : 0;
        const successCount = calls.filter(c => c.status === 'completed').length;
        const successRate = totalCalls > 0 ? (successCount / totalCalls) * 100 : 0;

        // 4. Prepare Chart Data (Calls per day)
        const callsPerDay: Record<string, number> = {};
        const spendPerDay: Record<string, number> = {};

        // Initialize placeholders for all days in range
        for (let i = 0; i <= days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString();
            callsPerDay[dateStr] = 0;
            spendPerDay[dateStr] = 0;
        }

        calls.forEach(call => {
            const dateStr = new Date(call.started_at).toLocaleDateString();
            if (callsPerDay[dateStr] !== undefined) {
                callsPerDay[dateStr]++;
                spendPerDay[dateStr] += Number(call.cost) || 0;
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
        const statusCounts = calls.reduce((acc, c) => {
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
            recentCalls: calls.slice(-5).reverse()
        });
    } catch (error: any) {
        console.error('Stats error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
