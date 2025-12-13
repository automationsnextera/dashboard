"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Call } from "@/components/dashboard/calls/columns"
import { CallsTableWrapper } from "@/components/dashboard/calls/calls-table-wrapper"

function CallsPageContent() {
    const searchParams = useSearchParams()
    const page = parseInt(searchParams.get("page") || "1")
    const PAGE_SIZE = 20

    const [calls, setCalls] = useState<Call[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchCalls = async () => {
            try {
                const res = await fetch("/api/vapi/calls")
                if (res.ok) {
                    const data = await res.json()
                    setCalls(Array.isArray(data) ? data : [])
                } else {
                    console.error("Failed to fetch calls")
                }
            } catch (error) {
                console.error("Error fetching calls:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchCalls()
    }, [])

    // Client-side pagination logic
    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE
    const paginatedCalls = calls.slice(from, to)
    const totalCount = calls.length
    const hasNextPage = totalCount > to
    const hasPreviousPage = page > 1

    if (loading) {
        return <div>Loading calls...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Call Logs</h2>
                <div className="text-sm text-muted-foreground">
                    Total: {totalCount}
                </div>
            </div>

            <div className="bg-card rounded-md border p-4">
                <CallsTableWrapper
                    data={paginatedCalls}
                    page={page}
                    hasNextPage={hasNextPage}
                    hasPreviousPage={hasPreviousPage}
                />
            </div>
        </div>
    )
}

export default function CallsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CallsPageContent />
        </Suspense>
    )
}
