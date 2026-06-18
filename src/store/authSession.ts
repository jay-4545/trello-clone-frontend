import type { AppDispatch } from "@/lib/store";
import { logout, setCredentials } from "@/store/slices/authSlice";
import { resetUnread } from "@/store/slices/notificationSlice";
import { connectSocket, disconnectSocket } from "@/lib/socket/socketClient";
import type { User } from "@/types/auth.types";

let loggingOut = false;

/** True while an intentional sign-out is in progress (suppresses 401 refresh storms). */
export function isLoggingOut(): boolean {
    return loggingOut;
}

export function resetLoggingOut(): void {
    loggingOut = false;
}

/**
 * End the session locally. Resets API cache and disconnects realtime channels.
 * Prefer `performLogout` when signing the user out from the UI.
 */
export function clearAuthSession(
    dispatch: AppDispatch,
    options?: { resetApi?: boolean }
): void {
    dispatch(logout());
    dispatch(resetUnread());
    disconnectSocket();
    // Resetting RTK cache while protected pages are still mounted refetches queries
    // (e.g. GET /workspaces). Defer reset to login via establishAuthSession instead.
    if (options?.resetApi) {
        void import("@/lib/api/baseApi").then(({ baseApi }) => {
            dispatch(baseApi.util.resetApiState());
        });
    }
}

/**
 * Professional sign-out: one server revoke (optional), then immediate local teardown
 * without triggering refresh retries or duplicate 401s from in-flight queries.
 */
export async function performLogout(
    dispatch: AppDispatch,
    serverLogout?: () => Promise<unknown>
): Promise<void> {
    if (loggingOut) return;
    loggingOut = true;

    try {
        if (serverLogout) {
            try {
                await serverLogout();
            } catch {
                // Server revoke is best-effort — always clear the client session.
            }
        }
    } finally {
        clearAuthSession(dispatch, { resetApi: false });
        window.setTimeout(() => {
            loggingOut = false;
        }, 1500);
    }
}

/** Start a new session with a clean API cache (call on login / register). */
export function establishAuthSession(
    dispatch: AppDispatch,
    payload: { user: User; accessToken: string; refreshToken: string }
) {
    resetLoggingOut();
    void import("@/lib/api/baseApi").then(({ baseApi }) => {
        dispatch(baseApi.util.resetApiState());
    });
    dispatch(setCredentials(payload));
    connectSocket();
}
