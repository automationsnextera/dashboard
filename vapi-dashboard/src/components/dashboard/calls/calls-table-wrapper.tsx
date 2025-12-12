"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { DataTable } from "@/components/dashboard/calls/data-table"
import { columns, Call } from "@/components/dashboard/calls/columns"

interface CallsTableWrapperProps {
    data: Call[]
    page: number
    hasNextPage: boolean
    hasPreviousPage: boolean
}

export function CallsTableWrapper({
    data,
    page,
    hasNextPage,
    hasPreviousPage,
}: CallsTableWrapperProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const createQueryString = (name: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set(name, value)
        return params.toString()
    }

    return (
        <DataTable
            columns={columns}
            data={data}
            hasNextPage={hasNextPage}
            hasPreviousPage={hasPreviousPage}
            onNextPage={() => {
                router.push(`${pathname}?${createQueryString("page", (page + 1).toString())}`)
            }}
            onPreviousPage={() => {
                router.push(`${pathname}?${createQueryString("page", (page - 1).toString())}`)
            }}
        />
    )
}
