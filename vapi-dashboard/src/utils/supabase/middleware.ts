import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const requestUrl = new URL(request.url)
    const pathname = requestUrl.pathname

    // Bypassed routes (public)
    if (pathname.startsWith('/login') || pathname.startsWith('/auth') || pathname.startsWith('/api/webhooks')) {
        // If user is logged in and tries to go to login, redirect to dashboard
        if (pathname.startsWith('/login') && user) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
        return response
    }

    // Protected routes (everything else)
    if (!user) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Root path redirect to dashboard
    if (pathname === '/') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
}
