import { token, isTokenExpired } from "@/utils/token";
import { updateTokens } from "@/store/slices/authSlice";
import { isLoggingOut } from "@/store/authSession";
import { reconnectSocketWithFreshToken } from "@/lib/socket/socketClient";
import { getAppStore } from "@/lib/appStoreRef";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

let refreshPromise: Promise<boolean> | null = null;

function applyTokenPair(accessToken: string, refreshToken: string): void {
    token.setTokenPair(accessToken, refreshToken);
    getAppStore()?.dispatch(updateTokens());
    reconnectSocketWithFreshToken();
}

/**
 * Refresh the access token using the stored refresh token.
 * Mutexed — concurrent callers share one in-flight request.
 */
export async function refreshAccessToken(): Promise<boolean> {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
        try {
            if (isLoggingOut()) return false;

            const refreshToken = token.getRefresh();
            if (!refreshToken || isTokenExpired(refreshToken, 30)) return false;

            const res = await fetch(`${API_URL}/auth/refresh`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken }),
            });

            if (!res.ok) return false;

            const body = (await res.json()) as {
                success?: boolean;
                data?: { accessToken: string; refreshToken: string };
            };

            const next = body?.data;
            if (!next?.accessToken || !next?.refreshToken) return false;

            applyTokenPair(next.accessToken, next.refreshToken);
            return true;
        } catch {
            return false;
        } finally {
            setTimeout(() => { refreshPromise = null; }, 0);
        }
    })();

    return refreshPromise;
}

/** Refresh if access is missing or expiring within the buffer window. */
export async function ensureValidAccessToken(bufferSeconds = 120): Promise<boolean> {
    const access = token.getAccess();
    if (access && !isTokenExpired(access, bufferSeconds)) return true;
    if (!token.getRefresh()) return false;
    return refreshAccessToken();
}
