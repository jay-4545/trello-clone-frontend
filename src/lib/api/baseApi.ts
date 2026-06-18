import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { token } from "@/utils/token";
import { clearAuthSession, isLoggingOut } from "@/store/authSession";
import { refreshAccessToken } from "@/lib/auth/tokenRefresh";
import type { AppDispatch, RootState } from "@/lib/store";
import { redirectToLogin, isAuthPage } from "@/utils/authRedirect";

const rawBaseQuery = fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    prepareHeaders: (headers) => {
        const accessToken = token.getAccess();
        if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
        return headers;
    },
});

const AUTH_ENDPOINTS_SKIP_REFRESH = new Set([
    "/auth/refresh",
    "/auth/login",
    "/auth/register",
    "/auth/logout",
]);

function getRequestUrl(args: string | FetchArgs): string {
    const raw = typeof args === "string" ? args : args.url;
    try {
        return new URL(raw, "http://local").pathname;
    } catch {
        return raw.split("?")[0] ?? raw;
    }
}

function shouldAttemptRefresh(state: RootState): boolean {
    if (isLoggingOut()) return false;
    if (!token.getRefresh() || token.isRefreshTokenExpired(30)) return false;
    return state.auth.isAuthenticated || !!token.getAccess() || !!token.getRefresh();
}

function handleSessionExpired(dispatch: AppDispatch): void {
    if (isLoggingOut()) return;
    if (typeof window !== "undefined" && isAuthPage(window.location.pathname)) return;

    clearAuthSession(dispatch, { resetApi: false });
    redirectToLogin();
}

/** Refresh access token before the request when it is missing or near expiry. */
async function ensureFreshAccessToken(url: string): Promise<void> {
    if (AUTH_ENDPOINTS_SKIP_REFRESH.has(url)) return;
    if (isLoggingOut()) return;

    const refresh = token.getRefresh();
    if (!refresh || token.isRefreshTokenExpired(30)) return;

    const access = token.getAccess();
    if (access && !token.isAccessTokenExpired(30)) return;

    await refreshAccessToken();
}

const baseQueryWithReauth: BaseQueryFn<
    string | FetchArgs,
    unknown,
    FetchBaseQueryError
> = async (args, api, extraOptions) => {
    const url = getRequestUrl(args);
    await ensureFreshAccessToken(url);

    let result = await rawBaseQuery(args, api, extraOptions);

    if (result.error?.status !== 401) return result;

    if (AUTH_ENDPOINTS_SKIP_REFRESH.has(url)) return result;

    const state = api.getState() as RootState;

    if (isLoggingOut() || !shouldAttemptRefresh(state)) {
        return result;
    }

    const refreshed = await refreshAccessToken();

    if (refreshed && !isLoggingOut()) {
        result = await rawBaseQuery(args, api, extraOptions);
        if (result.error?.status === 401) {
            handleSessionExpired(api.dispatch as AppDispatch);
        }
        return result;
    }

    handleSessionExpired(api.dispatch as AppDispatch);
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
        "AdminWorkspaces",
        "AdminBoards",
        "AdminCards",
        "AdminComments",
        "AdminErrorLogs",
    ],
    endpoints: () => ({}),
});
