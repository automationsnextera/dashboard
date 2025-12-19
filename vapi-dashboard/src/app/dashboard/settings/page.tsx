"use client"
// Trigger revalidation


import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

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
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [name, setName] = useState("")
    const [primaryColor, setPrimaryColor] = useState("#3b82f6")

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch("/api/dashboard/settings")
                if (res.ok) {
                    const json = await res.json()
                    setData(json)
                    setName(json.client.name)
                    setPrimaryColor(json.client.branding?.primaryColor || "#3b82f6")
                }
            } catch (error) {
                console.error("Error fetching settings:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchSettings()
    }, [])

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch("/api/dashboard/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    branding: { ...data.client.branding, primaryColor }
                })
            })
            if (res.ok) {
                alert("Settings saved successfully!")
            }
        } catch (error) {
            console.error("Error saving settings:", error)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-8 text-center">Loading settings...</div>
    if (!data) return <div className="p-8 text-center text-destructive">Failed to load settings.</div>

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">Manage your white-label branding and API configurations.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Branding & Identity</CardTitle>
                        <CardDescription>Customize your client dashboard appearance.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="client-name">Organization Name</Label>
                            <Input
                                id="client-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="primary-color">Primary Branding Color</Label>
                            <div className="flex items-center space-x-2">
                                <Input
                                    id="primary-color"
                                    type="color"
                                    className="w-12 h-10 p-1"
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                />
                                <Input
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                />
                            </div>
                        </div>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? "Saving..." : "Save Branding"}
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Vapi Integration</CardTitle>
                        <CardDescription>Configure your analytics data source.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Webhook Endpoint URL</Label>
                            <div className="flex items-center space-x-2">
                                <Input value={data.webhookUrl} readOnly />
                                <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(data.webhookUrl)}>
                                    Copy
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Paste this into your Vapi Dashboard &rarr; Assistants &rarr; Webhooks or the global Webhook settings.
                            </p>
                        </div>
                        <div className="pt-2">
                            <p className="text-sm font-medium">Data Sync Status</p>
                            <div className="flex items-center space-x-2 mt-1">
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                <span className="text-xs text-muted-foreground">Actively receiving Vapi events</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Access Control</CardTitle>
                        <CardDescription>Your role and permissions in this organization.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-4">
                            <div>
                                <p className="font-medium">{data.profile.fullName}</p>
                                <p className="text-sm text-muted-foreground">{data.profile.role}</p>
                            </div>
                            <Badge>{data.profile.role}</Badge>
                        </div>
                        <div className="pt-4">
                            <h4 className="text-sm font-semibold mb-2">Sharable Dashboard Link</h4>
                            <div className="flex items-center space-x-2">
                                <Input value={`${window.location.origin}/dashboard`} readOnly />
                                <Button variant="outline" size="sm">Share</Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Users with "Client" role will see a read-only version of this link.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

