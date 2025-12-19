import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar"
import { UserNav } from "@/components/dashboard/user-nav"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    // Check if profile is complete
    const { data: profile } = await supabase
        .from("profiles")
        .select("client_id")
        .eq("id", user.id)
        .single()

    if (!profile?.client_id) {
        redirect("/onboarding")
    }

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar for desktop */}
            <aside className="hidden w-64 border-r bg-background md:block">
                <Sidebar className="h-full" />
            </aside>

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Header */}
                <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
                    <MobileSidebar />
                    <div className="flex flex-1 items-center justify-between">
                        <h1 className="text-lg font-semibold">Dashboard</h1>
                        <UserNav />
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto bg-muted/10 p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
