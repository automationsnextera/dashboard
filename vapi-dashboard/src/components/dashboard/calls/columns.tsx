"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"

export type Call = {
    id: string
    status: string
    duration: number
    cost: number
    startedAt: string
    endedAt: string
    assistant?: {
        name?: string
        model?: {
            model?: string
        }
    }
    summary?: string
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
                case "in-progress":
                    variant = "default"
                    break
                case "completed":
                case "success":
                    variant = "secondary"
                    break
                case "failed":
                case "error":
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
        accessorKey: "assistant",
        header: "Assistant",
        cell: ({ row }) => {
            const assistant = row.original.assistant;
            const name = assistant?.name || "Unknown Agent";
            return <div className="font-medium">{name}</div>
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
        accessorKey: "startedAt",
        header: "Date",
        cell: ({ row }) => {
            return (
                <div className="text-muted-foreground text-sm">
                    {new Date(row.getValue("startedAt")).toLocaleString()}
                </div>
            )
        },
    },
    {
        accessorKey: "summary",
        header: "Summary",
        cell: ({ row }) => {
            return (
                <div className="text-muted-foreground text-sm truncate max-w-[200px]">
                    {row.getValue("summary") || "-"}
                </div>
            )
        },
    }
]
