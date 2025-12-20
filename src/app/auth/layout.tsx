"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isReady, setIsReady] = useState(false);

    // If user is already logged in, redirect to home
    useEffect(() => {
        if (status === "authenticated") {
            router.push("/");
        } else if (status !== "loading") {
            setIsReady(true);
        }
    }, [status, router]);

    // Show nothing while checking auth
    if (!isReady) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800">
            {children}
        </div>
    );
}