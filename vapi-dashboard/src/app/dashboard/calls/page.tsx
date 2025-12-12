import { createClient } from "@/utils/supabase/server"
import { Call } from "@/components/dashboard/calls/columns"
import { CallsTableWrapper } from "@/components/dashboard/calls/calls-table-wrapper"

export default async function CallsPage({
    searchParams,
}: {
    searchParams: { page?: string }
}) {
    const supabase = createClient()

    const PAGE_SIZE = 20
    const page = parseInt(searchParams.page || "1")
    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    // Fetch calls with joined agents
    const { data, count, error } = await supabase
        .from('calls')
        .select(`
      *,
      agents (
        name
      )
    `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

    if (error) {
        console.error("Error fetching calls:", error)
    }

    const calls = data as unknown as Call[] || []
    const totalCount = count || 0

    const hasNextPage = totalCount > to + 1
    const hasPreviousPage = page > 1

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Call Logs</h2>
            </div>

            <div className="bg-card rounded-md border p-4">
                {/* We format pagination links via Next.js navigation in the client component or wrapping it.
            Actually, DataTable expects callbacks. BUT since we are server side, we should pass Links.
            OR we can make a Client Wrapper for the table that handles router.push for pagination.
            However, DataTable accepts callbacks. Let's make a Client Wrapper in the page? 
            No, let's keep it simple. We can use <Link> buttons in a separate component or 
            just pass simplified props to DataTable and let it be client interactive for row click.
            
            Wait, I implemented callbacks in DataTable. I need to wire them to router.push or <Link>.
            Actually, I can just create a client component wrapper for the table that takes the data and handles pagination logic via router.push.
         */}

                <CallsTableWrapper
                    data={calls}
                    page={page}
                    hasNextPage={hasNextPage}
                    hasPreviousPage={hasPreviousPage}
                />
            </div>
        </div>
    )
}


