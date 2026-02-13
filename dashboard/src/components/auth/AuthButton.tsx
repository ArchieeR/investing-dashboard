"use client"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { UserNav } from "@/components/layout/UserNav"
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth"
import { auth } from "@/lib/firebase/config"
import { Loader2 } from "lucide-react"

export function AuthButton() {
    const { user, loading } = useAuth()

    const handleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Error signing in", error);
        }
    }

    if (loading) {
        return (
            <Button variant="ghost" size="icon">
                <Loader2 className="h-4 w-4 animate-spin" />
            </Button>
        )
    }

    if (user) {
        return <UserNav />
    }

    return (
        <Button onClick={handleSignIn} variant="default" className="bg-[#007AFF] hover:bg-[#0056b3] text-white">
            Sign In
        </Button>
    )
}
