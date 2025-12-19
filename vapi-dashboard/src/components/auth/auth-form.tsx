'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { login, signup, signInWithGoogle } from '@/app/login/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

function SubmitButton({ isLogin }: { isLogin: boolean }) {
    const { pending } = useFormStatus()

    return (
        <Button className="w-full" type="submit" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLogin ? 'Sign In' : 'Sign Up'}
        </Button>
    )
}

export function AuthForm() {
    const [isLogin, setIsLogin] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Wrapper to handle server action results
    const handleSubmit = async (formData: FormData) => {
        setError(null)
        const action = isLogin ? login : signup
        const result = await action(formData)

        if (result?.error) {
            setError(result.error)
        }
    }

    return (
        <Card className="w-[350px]">
            <CardHeader>
                <CardTitle>{isLogin ? 'Login' : 'Create an account'}</CardTitle>
                <CardDescription>
                    {isLogin
                        ? 'Enter your email below to login to your account'
                        : 'Enter your email below to create your account'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={handleSubmit}>
                    <div className="grid w-full items-center gap-4">
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" placeholder="m@example.com" required />
                        </div>
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" name="password" type="password" required />
                        </div>
                    </div>
                    {error && (
                        <div className="mt-4 p-2 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
                            {error}
                        </div>
                    )}
                    <div className="mt-4">
                        <SubmitButton isLogin={isLogin} />
                    </div>
                </form>
                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                            Or continue with
                        </span>
                    </div>
                </div>
                <form action={async () => {
                    const result = await signInWithGoogle()
                    if (result?.error) {
                        setError(result.error)
                    }
                }}>
                    <Button variant="outline" type="submit" className="w-full">
                        <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                            <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                        </svg>
                        Google
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex justify-center">
                <Button
                    variant="link"
                    onClick={() => {
                        setIsLogin(!isLogin)
                        setError(null)
                    }}
                >
                    {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </Button>
            </CardFooter>
        </Card>
    )
}
