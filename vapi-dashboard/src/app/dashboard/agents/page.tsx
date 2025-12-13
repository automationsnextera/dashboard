"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bot, Mic, MessageSquare } from "lucide-react"

interface Agent {
    id: string
    name: string
    model: string
    voice: string
    systemPrompt: string
    updatedAt: string
}

export default function AgentsPage() {
    const [agents, setAgents] = useState<Agent[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAgents = async () => {
            try {
                const res = await fetch("/api/vapi/agents")
                if (res.ok) {
                    const data = await res.json()
                    setAgents(Array.isArray(data) ? data : [])
                } else {
                    console.error("Failed to fetch agents")
                }
            } catch (error) {
                console.error("Error fetching agents:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchAgents()
    }, [])

    if (loading) {
        return <div>Loading agents...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Agents & Assistants</h2>
                <Button>Create Agent</Button>
            </div>

            {agents.length === 0 ? (
                <div className="text-center text-muted-foreground p-10">
                    No agents found. Create one in VAPI dashboard.
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {agents.map((agent) => (
                        <Card key={agent.id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-xl">{agent.name}</CardTitle>
                                        <CardDescription className="text-xs pt-1">
                                            ID: {agent.id}
                                        </CardDescription>
                                    </div>
                                    <Badge variant="outline">Active</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <Bot className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">Model:</span> {agent.model}
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Mic className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">Voice:</span> {agent.voice}
                                </div>
                                <div className="space-y-2 pt-2">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                        System Prompt
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-3 bg-muted p-2 rounded-md">
                                        {agent.systemPrompt}
                                    </p>
                                </div>
                            </CardContent>
                            <CardFooter className="text-xs text-muted-foreground pt-4 border-t">
                                Last updated: {new Date(agent.updatedAt).toLocaleDateString()}
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
