"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, DollarSign, Clock } from "lucide-react"

interface Call {
    id: string
    status: string
    cost: number
    startedAt: string
    endedAt: string
    summary?: string
}

export default function DashboardPage() {
    const [calls, setCalls] = useState<Call[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchCalls = async () => {
            try {
                const res = await fetch("/api/vapi/stats")
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

    // Calculate metrics
    const totalCalls = calls.length
    const totalSpend = calls.reduce((sum, call) => sum + (call.cost || 0), 0)

    const totalDurationSeconds = calls.reduce((sum, call) => {
        if (call.startedAt && call.endedAt) {
            const start = new Date(call.startedAt).getTime()
            const end = new Date(call.endedAt).getTime()
            return sum + (end - start) / 1000
        }
        return sum
    }, 0)

    const avgDurationSeconds = totalCalls > 0 ? totalDurationSeconds / totalCalls : 0

    const formatDuration = (seconds: number) => {
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = Math.floor(seconds % 60)
        return `${minutes}m ${remainingSeconds}s`
    }

    // Recent calls (top 5)
    // Assuming the API returns calls sorted or we sort them? 
    // The prompt says "Recent Calls List... 5 most recent". 
    // We should probably sort by startedAt if not sorted. 
    // The API documentation says response is an array of objects. It doesn't specify order.
    // Let's sort by startedAt descending.
    const recentCalls = [...calls].sort((a, b) =>
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    ).slice(0, 5)

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Loading stats...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Total Calls Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCalls}</div>
                        <p className="text-xs text-muted-foreground">
                            Real-time data
                        </p>
                    </CardContent>
                </Card>

                {/* Total Spend Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalSpend.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">
                            Real-time data
                        </p>
                    </CardContent>
                </Card>

                {/* Avg Duration Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Duration</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatDuration(avgDurationSeconds)}</div>
                        <p className="text-xs text-muted-foreground">
                            Real-time data
                        </p>
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
