import { useEffect, useState } from "react";
import { token } from "@/utils/token";
import { useAppSelector } from "@/store";
import { isLoggingOut } from "@/store/authSession";

/**
 * Returns whether the user has an active session. Syncs with Redux auth state
 * so login/logout without a full page reload updates query skip flags correctly.
 */
export function useAuthToken(): boolean {
    const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
    const isInitialized = useAppSelector((state) => state.auth.isInitialized);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || isLoggingOut()) return false;
    if (!isInitialized) return false;
    return isAuthenticated || token.hasSession();
}
