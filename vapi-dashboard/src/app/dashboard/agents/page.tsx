"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart3, TrendingUp, Users } from "lucide-react"

export default function AgentsPage() {
    const [agents, setAgents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAgents = async () => {
            setLoading(true)
            try {
                const res = await fetch('/api/dashboard/agents')
                if (res.ok) {
                    const data = await res.json()
                    setAgents(data)
                }
            } catch (error) {
                console.error("Error fetching agents:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchAgents()
    }, [])

    const formatDuration = (seconds: number) => {
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = Math.floor(seconds % 60)
        return `${minutes}m ${remainingSeconds}s`
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Agent Performance</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{agents.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Overall Success Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {agents.length > 0
                                ? (agents.reduce((sum, a) => sum + a.metrics.successRate, 0) / agents.length).toFixed(0)
                                : 0}%
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Agent Cost</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${agents.reduce((sum, a) => sum + a.metrics.totalCost, 0).toFixed(2)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Agent List</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Agent Name</TableHead>
                                <TableHead>Total Calls</TableHead>
                                <TableHead>Avg Duration</TableHead>
                                <TableHead>Success Rate</TableHead>
                                <TableHead>Total Cost</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                        Loading agents...
                                    </TableCell>
                                </TableRow>
                            ) : agents.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                        No agents found.
                                    </TableCell>
                                </TableRow>
                            ) : agents.map((agent) => (
                                <TableRow key={agent.id}>
                                    <TableCell className="font-medium">
                                        {agent.name}
                                        <p className="text-xs text-muted-foreground font-normal">{agent.vapi_id}</p>
                                    </TableCell>
                                    <TableCell>{agent.metrics.totalCalls}</TableCell>
                                    <TableCell>{formatDuration(agent.metrics.avgDuration)}</TableCell>
                                    <TableCell>
                                        <Badge variant={agent.metrics.successRate > 80 ? 'default' : 'secondary'}>
                                            {agent.metrics.successRate.toFixed(0)}%
                                        </Badge>
                                    </TableCell>
                                    <TableCell>${agent.metrics.totalCost.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm">
                                            View Details
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
