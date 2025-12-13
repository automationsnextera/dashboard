"use client"
// Trigger revalidation


import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"

interface SettingsData {
    environment: string
    hasVapiKey: boolean
    features: {
        analytics: boolean
        callRecording: boolean
        realtimeTranscripts: boolean
    }
    version: string
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<SettingsData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch("/api/vapi/settings")
                if (res.ok) {
                    const data = await res.json()
                    setSettings(data)
                }
            } catch (error) {
                console.error("Error fetching settings:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchSettings()
    }, [])

    if (loading) {
        return <div>Loading settings...</div>
    }

    if (!settings) return <div>Failed to load settings.</div>

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">Manage your dashboard configuration.</p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Environment</CardTitle>
                        <CardDescription>
                            Current deployment configuration.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label>Environment Mode</Label>
                            <Badge variant="outline" className="capitalize">{settings.environment}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <Label>VAPI API Connection</Label>
                            {settings.hasVapiKey ? (
                                <Badge className="bg-green-600">Connected</Badge>
                            ) : (
                                <Badge variant="destructive">Missing Key</Badge>
                            )}
                        </div>
                        <div className="flex items-center justify-between">
                            <Label>Version</Label>
                            <span className="text-sm font-medium">{settings.version}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Feature Flags</CardTitle>
                        <CardDescription>
                            Active features in this dashboard.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Analytics Dashboard</Label>
                                <p className="text-sm text-muted-foreground">View call metrics.</p>
                            </div>
                            <Switch checked={settings.features.analytics} disabled />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Call Recording Access</Label>
                                <p className="text-sm text-muted-foreground">Listen to call recordings.</p>
                            </div>
                            <Switch checked={settings.features.callRecording} disabled />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Real-time Transcripts</Label>
                                <p className="text-sm text-muted-foreground">View live transcripts.</p>
                            </div>
                            <Switch checked={settings.features.realtimeTranscripts} disabled />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
