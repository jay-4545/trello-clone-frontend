import { token } from "@/utils/token";
import { resetLoggingOut } from "@/store/authSession";

let redirectingToLogin = false;

const AUTH_PAGES = ["/login", "/register"];

export function isAuthPage(pathname: string): boolean {
    return AUTH_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Clear session and hard-navigate to login once (prevents redirect loops). */
export function redirectToLogin(): void {
    if (typeof window === "undefined") return;
    if (redirectingToLogin) return;
    if (isAuthPage(window.location.pathname)) {
        token.clearAll();
        return;
    }

    redirectingToLogin = true;
    token.clearAll();
    window.location.assign("/login");
}

export function resetLoginRedirectGuard(): void {
    redirectingToLogin = false;
    resetLoggingOut();
}
