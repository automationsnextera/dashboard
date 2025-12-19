import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'


export default function AuthCodeError() {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 px-4">
            <div className="w-[350px] space-y-6">
                <div className="flex flex-col space-y-2 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Authentication Error
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        There was a problem signing you in.
                    </p>
                </div>

                <div className="bg-destructive/15 text-destructive border-destructive/20 border p-4 rounded-md flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                    <div className="space-y-1">
                        <h5 className="font-medium leading-none tracking-tight">Error</h5>
                        <div className="text-sm opacity-90">
                            We could not verify your identity with the provider. This often happens if the Google Sign-In configuration is missing or incorrect.
                        </div>
                    </div>
                </div>

                <div className="flex justify-center">
                    <Button asChild variant="outline">
                        <Link href="/login">
                            Return to Login
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
