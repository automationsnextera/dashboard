import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, DollarSign, Clock } from "lucide-react"

export default async function DashboardPage() {
    const supabase = createClient()

    // Fetch calls
    // We limit to 1000 for aggregation for now, or could use count
    const { data: calls, error, count } = await supabase
        .from('calls')
        .select('duration, cost, status', { count: 'exact' })
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Error fetching dashboard data", error)
    }

    const totalCalls = count || 0
    const validCalls = calls || []

    // Calculate stats
    const totalCost = validCalls.reduce((acc, call) => acc + (call.cost || 0), 0)

    // Calculate average duration (in seconds)
    const totalDuration = validCalls.reduce((acc, call) => acc + (call.duration || 0), 0)
    const avgDuration = totalCalls > 0 ? totalDuration / totalCalls : 0

    // Format duration to mm:ss
    const formatDuration = (seconds: number) => {
        const min = Math.floor(seconds / 60)
        const sec = Math.floor(seconds % 60)
        return `${min}m ${sec}s`
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Calls
                        </CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCalls}</div>
                        <p className="text-xs text-muted-foreground">
                            +0% from last month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Spend
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">
                            +0% from last month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Avg. Duration
                        </CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatDuration(avgDuration)}</div>
                        <p className="text-xs text-muted-foreground">
                            +0% from last month
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
