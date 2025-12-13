import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function CallDetailsPage({
    params,
}: {
    params: { id: string }
}) {
    const supabase = createClient()

    const { data: call, error } = await supabase
        .from('calls')
        .select(`
      *,
      agents (
        name
      )
    `)
        .eq('id', params.id)
        .single()

    if (error || !call) {
        return <div>Call not found</div>
    }

    // Parse transcript if possible
    let transcriptMessages = []
    try {
        if (typeof call.transcript === 'string') {
            transcriptMessages = JSON.parse(call.transcript)
        } else if (Array.isArray(call.transcript)) {
            transcriptMessages = call.transcript
        }
    } catch {
        // Treat as plain text or failed
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/dashboard/calls">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Call Details</h2>
                    <p className="text-sm text-muted-foreground">{call.id}</p>
                </div>
                <div className="ml-auto">
                    <Badge variant={call.status === 'active' ? 'default' : 'secondary'}>
                        {call.status}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* Main Content: Transcript and Audio */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recording</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {call.recording_url ? (
                                <audio controls className="w-full" src={call.recording_url}>
                                    Your browser does not support the audio element.
                                </audio>
                            ) : (
                                <div className="text-sm text-muted-foreground">No recording available</div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Transcript</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {transcriptMessages.length > 0 ? (
                                transcriptMessages.map((msg: { role: string; message?: string; content?: string; text?: string }, index: number) => (
                                    <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                        <div className={`px-4 py-2 rounded-lg max-w-[80%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                            <p className="text-sm">{msg.message || msg.content || msg.text}</p>
                                        </div>
                                        <span className="text-xs text-muted-foreground mt-1 capitalize">{msg.role}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="whitespace-pre-wrap text-sm">
                                    {typeof call.transcript === 'string' ? call.transcript : 'No transcript available'}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar: Analysis and Metadata */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Analysis</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="text-sm font-medium">Summary</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {call.summary || "No summary available."}
                                </p>
                            </div>
                            <Separator />
                            <div>
                                <h4 className="text-sm font-medium">Sentiment</h4>
                                <div className="mt-2 text-2xl">
                                    {/* Simple sentiment display */}
                                    {call.sentiment ? (
                                        <Badge>{call.sentiment}</Badge>
                                    ) : (
                                        <span className="text-sm text-muted-foreground">--</span>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Metadata</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Duration</span>
                                <span className="text-sm font-medium">{Math.floor((call.duration || 0) / 60)}m {Math.floor((call.duration || 0) % 60)}s</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Cost</span>
                                <span className="text-sm font-medium">${(call.cost || 0).toFixed(4)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Agent</span>
                                <span className="text-sm font-medium">{call.agents?.name || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Started At</span>
                                <span className="text-sm font-medium">{new Date(call.created_at).toLocaleString()}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Debug</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                                {JSON.stringify(call, null, 2)}
                            </pre>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
