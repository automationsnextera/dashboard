"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, DollarSign, Clock, Phone, PhoneOff, CheckCircle2 } from "lucide-react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, LineChart, Line } from "recharts"

interface Call {
    id: string
    status: string
    cost: number
    startedAt: string
    endedAt: string
    duration: number
    summary?: string
}

export default function DashboardPage() {
    const [calls, setCalls] = useState<Call[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchCalls = async () => {
            try {
                const res = await fetch("/api/vapi/calls")
                if (res.ok) {
                    const data = await res.json()
                    setCalls(Array.isArray(data) ? data : [])
                } else {
                    console.error("Failed to fetch calls")
                }
            } catch (error) {
                console.error("Error fetching calls:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchCalls()
    }, [])

    // Metrics
    const totalCalls = calls.length
    const totalSpend = calls.reduce((sum, call) => sum + (call.cost || 0), 0)
    const totalDurationSeconds = calls.reduce((sum, call) => sum + (call.duration || 0), 0)
    const avgDurationSeconds = totalCalls > 0 ? totalDurationSeconds / totalCalls : 0

    const formatDuration = (seconds: number) => {
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = Math.floor(seconds % 60)
        return `${minutes}m ${remainingSeconds}s`
    }

    // Chart Data Preparation
    const statusCounts = calls.reduce((acc, call) => {
        const status = call.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const pieData = Object.keys(statusCounts).map(status => ({
        name: status,
        value: statusCounts[status]
    }));

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    // Calls per day (last 7 days approx)
    const callsPerDay = calls.reduce((acc, call) => {
        const date = new Date(call.startedAt).toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Sort dates
    const lineData = Object.keys(callsPerDay)
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
        .slice(-7) // Last 7 days available
        .map(date => ({
            date,
            calls: callsPerDay[date]
        }));


    const recentCalls = [...calls].sort((a, b) =>
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    ).slice(0, 5)

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Loading dashboard...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                        <Phone className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCalls}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalSpend.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Duration</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatDuration(avgDurationSeconds)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {totalCalls > 0 ? ((statusCounts['completed'] || 0) / totalCalls * 100).toFixed(0) : 0}%
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Calls Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={lineData}>
                                    <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="calls" stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Call Status Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-4 text-sm text-muted-foreground">
                            {pieData.map((entry, index) => (
                                <div key={entry.name} className="flex items-center gap-1">
                                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    <span>{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Calls List */}
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="flex flex-col space-y-1.5 p-6">
                    <h3 className="font-semibold leading-none tracking-tight">Recent Calls</h3>
                </div>
                <div className="p-6 pt-0">
                    <div className="space-y-4">
                        {recentCalls.length === 0 ? (
                            <div className="text-sm text-muted-foreground">No recent calls found.</div>
                        ) : (
                            recentCalls.map((call) => (
                                <div key={call.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            {call.summary || "No summary available"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {call.status} • {new Date(call.startedAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="font-medium">
                                        ${(call.cost || 0).toFixed(2)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

