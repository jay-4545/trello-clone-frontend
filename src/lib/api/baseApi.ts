import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { token } from "@/utils/token";
import { logout } from "@/store/slices/authSlice";

const rawBaseQuery = fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    prepareHeaders: (headers) => {
        const accessToken = token.getAccess();
        if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
        return headers;
    },
});

// Module-scoped mutex so concurrent 401s share one refresh attempt
let refreshPromise: Promise<boolean> | null = null;

async function performRefresh(
    api: Parameters<BaseQueryFn>[1],
    extraOptions: Parameters<BaseQueryFn>[2]
): Promise<boolean> {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
        try {
            const refreshToken = token.getRefresh();
            if (!refreshToken) return false;

            const result = await rawBaseQuery(
                { url: "/auth/refresh", method: "POST", body: { refreshToken } },
                api,
                extraOptions
            );

            // API envelope: { success, message, data: { accessToken, refreshToken } }
            const body = result.data as
                | { success?: boolean; data?: { accessToken: string; refreshToken: string } }
                | undefined;
            const next = body?.data;

            if (next?.accessToken && next?.refreshToken) {
                token.setTokenPair(next.accessToken, next.refreshToken);
                return true;
            }
            return false;
        } catch {
            return false;
        } finally {
            // Allow next refresh after a tick so awaiting callers see the result
            setTimeout(() => { refreshPromise = null; }, 0);
        }
    })();

    return refreshPromise;
}

const baseQueryWithReauth: BaseQueryFn<
    string | FetchArgs,
    unknown,
    FetchBaseQueryError
> = async (args, api, extraOptions) => {
    let result = await rawBaseQuery(args, api, extraOptions);

    if (result.error?.status !== 401) return result;

    // Never try to refresh the refresh endpoint itself (avoids loops)
    const url = typeof args === "string" ? args : args.url;
    if (url === "/auth/refresh" || url === "/auth/login" || url === "/auth/register") {
        return result;
    }

    const refreshed = await performRefresh(api, extraOptions);

    if (refreshed) {
        // Retry the original request with the new access token
        result = await rawBaseQuery(args, api, extraOptions);
    } else {
        token.clearAll();
        api.dispatch(logout());
        // Force navigation to login if we're in a browser session
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
            window.location.assign("/login");
        }
    }

    return result;
};

export const baseApi = createApi({
    reducerPath: "api",
    baseQuery: baseQueryWithReauth,
    tagTypes: [
        "Auth",
        "Workspace",
        "WorkspaceMember",
        "Board",
        "BoardMember",
        "List",
        "Card",
        "Comment",
        "Notification",
        "Todo",
        "AdminUsers",
        "AdminStats",
    ],
    endpoints: () => ({}),
});
