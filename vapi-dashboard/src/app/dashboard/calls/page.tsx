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
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Search,
    Filter,
    Download,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    Play
} from "lucide-react"

export default function CallsPage() {
    const [calls, setCalls] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [status, setStatus] = useState("all")
    const [search, setSearch] = useState("")
    const [selectedCall, setSelectedCall] = useState<any>(null)

    useEffect(() => {
        const fetchCalls = async () => {
            setLoading(true)
            try {
                const res = await fetch(`/api/dashboard/calls?page=${page}&status=${status}&search=${search}`)
                if (res.ok) {
                    const data = await res.json()
                    setCalls(data.data)
                    setTotalPages(data.pagination.totalPages)
                }
            } catch (error) {
                console.error("Error fetching calls:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchCalls()
    }, [page, status, search])

    const formatDuration = (seconds: number) => {
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = Math.floor(seconds % 60)
        return `${minutes}m ${remainingSeconds}s`
    }

    const getStatusVariant = (s: string) => {
        switch (s) {
            case 'completed': return 'default'
            case 'started': return 'secondary'
            case 'failed': return 'destructive'
            default: return 'outline'
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Call Records</h2>
                <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Total Calls</CardTitle>
                        <div className="flex items-center space-x-2">
                            <div className="relative w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search transcripts or status..."
                                    className="pl-8"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="flex h-10 w-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="all">All Statuses</option>
                                <option value="completed">Completed</option>
                                <option value="started">Started</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Agent</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Cost</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                        Loading calls...
                                    </TableCell>
                                </TableRow>
                            ) : calls.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                        No calls found.
                                    </TableCell>
                                </TableRow>
                            ) : calls.map((call) => (
                                <TableRow key={call.id}>
                                    <TableCell className="font-medium">
                                        {new Date(call.started_at).toLocaleString()}
                                    </TableCell>
                                    <TableCell>{call.agents?.name || 'Unnamed Agent'}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(call.status)}>
                                            {call.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{formatDuration(call.duration || 0)}</TableCell>
                                    <TableCell>${(Number(call.cost) || 0).toFixed(2)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedCall(call)}
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <div className="flex items-center justify-end space-x-2 py-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>
                        <div className="text-sm font-medium">
                            Page {page} of {totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Basic Call Detail Modal Overlay */}
            {selectedCall && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <CardHeader className="flex flex-row items-center justify-between border-b">
                            <CardTitle>Call Details</CardTitle>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedCall(null)}>
                                Close
                            </Button>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Call ID</p>
                                    <p className="text-sm">{selectedCall.vapi_call_id}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Agent</p>
                                    <p className="text-sm">{selectedCall.agents?.name || 'Unnamed'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Start Time</p>
                                    <p className="text-sm">{new Date(selectedCall.started_at).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Duration</p>
                                    <p className="text-sm">{formatDuration(selectedCall.duration)}</p>
                                </div>
                            </div>

                            {selectedCall.recording_url && (
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-muted-foreground">Recording</p>
                                    <audio controls className="w-full">
                                        <source src={selectedCall.recording_url} type="audio/mpeg" />
                                    </audio>
                                </div>
                            )}

                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">Transcript</p>
                                <div className="bg-muted p-4 rounded-md text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
                                    {selectedCall.transcript || "No transcript available."}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">Raw Metadata</p>
                                <pre className="bg-slate-950 text-slate-50 p-4 rounded-md text-xs overflow-x-auto">
                                    {JSON.stringify(selectedCall.metadata, null, 2)}
                                </pre>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
