"use client"

import { useEffect, useState } from "react"
import { useVapi } from "@/contexts/VapiContext"
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
    const { isMissingKey } = useVapi()
    const [stats, setStats] = useState<{
        kpis: any;
        chartData: any[];
        pieData: any[];
        recentCalls: any[];
    } | null>(null)
    const [loading, setLoading] = useState(true)
    const [days, setDays] = useState(7)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
        const fetchStats = async () => {
            setLoading(true)
            try {
                const res = await fetch(`/api/dashboard/stats?days=${days}`)
                if (res.ok) {
                    const data = await res.json()
                    setStats(data)
                } else if (res.status === 400) {
                    console.error("Incomplete profile detected")
                    // If the profile is incomplete, the layout should technically redirect,
                    // but we handle it here just in case.
                }
            } catch (error) {
                console.error("Error fetching stats:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [days])

    if (loading && !stats) {
        return <div className="p-8 text-center text-muted-foreground">Loading dashboard...</div>
    }

    const { kpis, chartData, pieData, recentCalls } = stats || {
        kpis: { totalCalls: 0, totalSpend: 0, avgDuration: 0, successRate: 0 },
        chartData: [],
        pieData: [],
        recentCalls: []
    }

    const formatDuration = (seconds: number) => {
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = Math.floor(seconds % 60)
        return `${minutes}m ${remainingSeconds}s`
    }

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
                <div className="flex items-center space-x-2">
                    <select
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                        className="flex h-9 w-[180px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                        <option value={7}>Last 7 days</option>
                        <option value={30}>Last 30 days</option>
                        <option value={90}>Last 90 days</option>
                    </select>
                </div>
            </div>

            {isMissingKey && (
                <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">Action Required: API Key Missing</h3>
                            <div className="mt-2 text-sm text-yellow-700">
                                <p>You have not configured your Vapi API Key yet. The dashboard cannot fetch your call statistics.</p>
                            </div>
                            <div className="mt-4">
                                <div className="-mx-2 -my-1.5 flex">
                                    <a href="/onboarding" className="rounded-md bg-yellow-50 px-2 py-1.5 text-sm font-medium text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 focus:ring-offset-yellow-50">Go to Settings &rarr;</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                        <Phone className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpis.totalCalls}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${kpis.totalSpend.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Duration</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatDuration(kpis.avgDuration)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpis.successRate.toFixed(0)}%</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Calls Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[350px] w-full min-h-[350px] relative overflow-hidden">
                            {isMounted && chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="calls" stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 8 }} />
                                        <Line type="monotone" dataKey="spend" stroke="#10b981" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : chartData.length === 0 && !loading ? (
                                <div className="h-full w-full flex items-center justify-center text-muted-foreground">No data available for this period.</div>
                            ) : (
                                <div className="h-full w-full flex items-center justify-center text-muted-foreground">Loading chart...</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Call Status Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full min-h-[300px] relative overflow-hidden">
                            {isMounted && pieData.length > 0 ? (
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
                                            {pieData.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : pieData.length === 0 && !loading ? (
                                <div className="h-full w-full flex items-center justify-center text-muted-foreground">No data available.</div>
                            ) : (
                                <div className="h-full w-full flex items-center justify-center text-muted-foreground">Loading chart...</div>
                            )}
                        </div>
                        <div className="flex justify-center gap-4 text-sm text-muted-foreground">
                            {pieData.map((entry: any, index: number) => (
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
                            recentCalls.map((call: any) => (
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

