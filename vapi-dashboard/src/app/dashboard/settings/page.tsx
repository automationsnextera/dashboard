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

import { Moon, Sun, Key, Copy, Check } from "lucide-react"
import { useTheme } from "next-themes"

export default function SettingsPage() {
    const { theme, setTheme } = useTheme()
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [name, setName] = useState("")
    const [primaryColor, setPrimaryColor] = useState("#3b82f6")
    const [vapiKey, setVapiKey] = useState("")
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch("/api/dashboard/settings")
                if (res.ok) {
                    const json = await res.json()
                    setData(json)
                    setName(json.client.name)
                    setPrimaryColor(json.client.branding?.primaryColor || "#3b82f6")
                    setVapiKey(json.vapi_api_key || "")
                }
            } catch (error) {
                console.error("Error fetching settings:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchSettings()
    }, [])

    const handleSaveBranding = async () => {
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
                alert("Branding saved successfully!")
            }
        } catch (error) {
            console.error("Error saving branding:", error)
        } finally {
            setSaving(false)
        }
    }

    const handleSaveApiKey = async () => {
        setSaving(true)
        try {
            const res = await fetch("/api/dashboard/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    vapi_api_key: vapiKey
                })
            })
            if (res.ok) {
                alert("API Key saved successfully!")
            }
        } catch (error) {
            console.error("Error saving API Key:", error)
        } finally {
            setSaving(false)
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (loading) return <div className="p-8 text-center">Loading settings...</div>
    if (!data) return <div className="p-8 text-center text-destructive">Failed to load settings.</div>

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">Manage your white-label branding, appearance, and API configurations.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">


                <Card>
                    <CardHeader>
                        <CardTitle>Appearance</CardTitle>
                        <CardDescription>Customize how the dashboard looks for you.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="dark-mode" className="flex flex-col space-y-1">
                                <span>Dark Mode</span>
                                <span className="font-normal text-xs text-muted-foreground">
                                    Switch between light and dark themes.
                                </span>
                            </Label>
                            <div className="flex items-center space-x-2">
                                <Sun className="h-4 w-4 text-muted-foreground" />
                                <Switch
                                    id="dark-mode"
                                    checked={theme === "dark"}
                                    onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                                />
                                <Moon className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>NextEra Configuration</CardTitle>
                        <CardDescription>Manage your NextEra keys and webhooks.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="vapi-key">Private API Key</Label>
                            <div className="flex items-center space-x-2">
                                <div className="relative flex-1">
                                    <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="vapi-key"
                                        type="password"
                                        className="pl-9"
                                        placeholder="nextera-xxx-xxx"
                                        value={vapiKey}
                                        onChange={(e) => setVapiKey(e.target.value)}
                                    />
                                </div>
                                <Button onClick={handleSaveApiKey} disabled={saving}>
                                    {saving ? "Saving..." : "Update"}
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Your private key is used to fetch call data from your AI agents.
                            </p>
                        </div>


                    </CardContent>
                </Card>

                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>Access Control</CardTitle>
                        <CardDescription>Your organization role and permissions.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-4">
                            <div>
                                <p className="font-medium">{data.profile.fullName}</p>
                                <p className="text-sm text-muted-foreground">{data.profile.role}</p>
                            </div>
                            <Badge variant="outline">{data.profile.role}</Badge>
                        </div>
                        <div className="pt-4">
                            <h4 className="text-sm font-semibold mb-2">Sharable Dashboard Link</h4>
                            <div className="flex items-center space-x-2">
                                <Input value={`${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard`} readOnly className="bg-muted text-xs" />
                                <Button variant="outline" size="sm" onClick={() => copyToClipboard(`${window.location.origin}/dashboard`)}>
                                    Copy Link
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

