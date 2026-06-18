"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import { setUser, setInitialized, logout } from "@/store/slices/authSlice";
import { authApi } from "@/lib/api/authApi";
import { token } from "@/utils/token";
import { ensureValidAccessToken, refreshAccessToken } from "@/lib/auth/tokenRefresh";
import { clearAuthSession, isLoggingOut } from "@/store/authSession";
import { redirectToLogin, isAuthPage, resetLoginRedirectGuard } from "@/utils/authRedirect";
import { connectSocket } from "@/lib/socket/socketClient";

const REFRESH_CHECK_MS = 60_000;
const EXPIRY_BUFFER_SECONDS = 120;

/**
 * Bootstraps auth from cookies, proactively refreshes access tokens,
 * and keeps the session alive while the app is open.
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const dispatch = useAppDispatch();
    const pathname = usePathname();
    const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
    const bootstrapped = useRef(false);
    const pathnameRef = useRef(pathname);

    pathnameRef.current = pathname;

    useEffect(() => {
        resetLoginRedirectGuard();
    }, [pathname]);

    useEffect(() => {
        if (!isAuthenticated) return;
        connectSocket();
    }, [isAuthenticated]);

    useEffect(() => {
        if (bootstrapped.current) return;
        bootstrapped.current = true;

        (async () => {
            if (!token.hasSession()) {
                dispatch(setInitialized());
                return;
            }

            const ok = await ensureValidAccessToken(EXPIRY_BUFFER_SECONDS);

            if (!ok) {
                if (!isAuthPage(pathnameRef.current)) {
                    clearAuthSession(dispatch, { resetApi: false });
                    redirectToLogin();
                } else {
                    dispatch(logout());
                }
                dispatch(setInitialized());
                return;
            }

            try {
                const result = await dispatch(
                    authApi.endpoints.getProfile.initiate(undefined, { forceRefetch: true })
                ).unwrap();

                if (result?.data) {
                    dispatch(setUser(result.data));
                    connectSocket();
                }
            } catch {
                if (!isAuthPage(pathnameRef.current)) {
                    clearAuthSession(dispatch, { resetApi: false });
                    redirectToLogin();
                }
            }

            dispatch(setInitialized());
        })();
    }, [dispatch]);

    useEffect(() => {
        const interval = window.setInterval(() => {
            if (isLoggingOut()) return;
            if (!token.getRefresh()) return;
            if (token.isAccessTokenExpiringSoon(EXPIRY_BUFFER_SECONDS)) {
                void refreshAccessToken();
            }
        }, REFRESH_CHECK_MS);

        return () => window.clearInterval(interval);
    }, []);

    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState !== "visible" || isLoggingOut()) return;
            if (!token.getRefresh()) return;
            if (token.isAccessTokenExpiringSoon(60)) {
                void refreshAccessToken();
            }
        };

        document.addEventListener("visibilitychange", onVisible);
        return () => document.removeEventListener("visibilitychange", onVisible);
    }, []);

    return children;
}
