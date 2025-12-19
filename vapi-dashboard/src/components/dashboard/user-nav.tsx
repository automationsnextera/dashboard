"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User as UserIcon } from "lucide-react"

export function UserNav() {
    const supabase = createClient()
    const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null)
    const [email, setEmail] = useState<string | null>(null)

    useEffect(() => {
        const getUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setEmail(user.email || null)
                const { data } = await supabase
                    .from('profiles')
                    .select('full_name, avatar_url')
                    .eq('id', user.id)
                    .single()

                if (data) {
                    setProfile(data)
                }
            }
        }
        getUserData()

        // Optional: Listen for profile changes
        const channel = supabase
            .channel('profile-changes')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'profiles'
            }, (payload) => {
                setProfile(payload.new as any)
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase])

    const initials = profile?.full_name
        ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
        : email ? email[0].toUpperCase() : 'U'

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || "User"} />
                        <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                            {profile?.full_name || "User"}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {email || "email@example.com"}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                        <Link href="/dashboard/profile" className="cursor-pointer w-full flex items-center justify-between">
                            Profile
                            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/dashboard/settings" className="cursor-pointer w-full flex items-center justify-between">
                            Settings
                            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => {
                    await supabase.auth.signOut()
                    window.location.href = '/login'
                }}>
                    Log out
                    <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

