"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Phone, Users, Settings } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type SidebarProps = React.HTMLAttributes<HTMLDivElement>

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname()
    const [clientName, setClientName] = useState("NextEra Dashboard")

    useEffect(() => {
        const fetchClient = async () => {
            try {
                const res = await fetch("/api/dashboard/settings")
                if (res.ok) {
                    const data = await res.json()
                    setClientName(data.client.name)
                } else if (res.status === 400) {
                    console.warn("Client profile incomplete, using default name.")
                }
            } catch (error) {
                console.error("Error fetching client for sidebar:", error)
            }
        }
        fetchClient()
    }, [])

    const routes = [
        {
            label: "Dashboard",
            icon: LayoutDashboard,
            href: "/dashboard",
            active: pathname === "/dashboard",
        },
        {
            label: "Calls",
            icon: Phone,
            href: "/dashboard/calls",
            active: pathname.startsWith("/dashboard/calls"),
        },
        {
            label: "Agents",
            icon: Users,
            href: "/dashboard/agents",
            active: pathname.startsWith("/dashboard/agents"),
        },
        {
            label: "Settings",
            icon: Settings,
            href: "/dashboard/settings",
            active: pathname.startsWith("/dashboard/settings"),
        },
    ]

    return (
        <div className={cn("pb-12", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                        {clientName}
                    </h2>
                    <div className="space-y-1">
                        {routes.map((route) => (
                            <Button
                                key={route.href}
                                variant={route.active ? "secondary" : "ghost"}
                                className="w-full justify-start"
                                asChild
                            >
                                <Link href={route.href}>
                                    <route.icon className="mr-2 h-4 w-4" />
                                    {route.label}
                                </Link>
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
