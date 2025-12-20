import { useSession } from "next-auth/react";

// Easy way to check if user is logged in
export function useAuth() {
    const { data: session, status } = useSession();

    return {
        user: session?.user,
        isLoading: status === "loading",
        isAuthenticated: status === "authenticated",
    };
}