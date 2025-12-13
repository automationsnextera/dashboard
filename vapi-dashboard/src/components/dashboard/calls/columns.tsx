"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
// import { ArrowUpDown, MoreHorizontal } from "lucide-react"

export type Call = {
    id: string
    status: "active" | "completed" | "failed" | "voicemail"
    duration: number
    cost: number
    created_at: string
    agent_id: string
    agents?: {
        name: string
    }
}

export const columns: ColumnDef<Call>[] = [
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string

            let variant: "default" | "secondary" | "destructive" | "outline" = "default"

            switch (status) {
                case "active":
                    variant = "default" // Blue-ish primary
                    break
                case "completed":
                    variant = "secondary" // Gray/Green depending on theme, maybe outline better
                    break
                case "failed":
                    variant = "destructive"
                    break
                case "voicemail":
                    variant = "outline"
                    break
                default:
                    variant = "outline"
            }

            return (
                <Badge variant={variant} className="capitalize">
                    {status}
                </Badge>
            )
        },
    },
    {
        accessorKey: "agents.name", // Assuming join
        header: "Agent",
        cell: ({ row }) => {
            // Handle nested data if flattened or handle missing
            const agentName = row.original.agents?.name || "Unknown Agent"
            return <div className="font-medium">{agentName}</div>
        },
    },
    {
        accessorKey: "duration",
        header: "Duration",
        cell: ({ row }) => {
            const duration = parseFloat(row.getValue("duration"))
            if (isNaN(duration)) return "-"
            const minutes = Math.floor(duration / 60)
            const seconds = Math.floor(duration % 60)
            return <div className="font-medium">{`${minutes}m ${seconds}s`}</div>
        },
    },
    {
        accessorKey: "cost",
        header: "Cost",
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("cost"))
            const formatted = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
            }).format(amount)

            return <div className="font-medium">{formatted}</div>
        },
    },
    {
        accessorKey: "created_at",
        header: "Date",
        cell: ({ row }) => {
            return (
                <div className="text-muted-foreground text-sm">
                    {new Date(row.getValue("created_at")).toLocaleString()}
                </div>
            )
        },
    },
]
