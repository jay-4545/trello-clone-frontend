import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { token } from "@/utils/token";
import { clearAuthSession, isLoggingOut } from "@/store/authSession";
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

// Module-scoped mutex so concurrent 401s share one refresh attempt
let refreshPromise: Promise<boolean> | null = null;

const AUTH_ENDPOINTS_SKIP_REFRESH = new Set([
    "/auth/refresh",
    "/auth/login",
    "/auth/register",
    "/auth/logout",
]);

function getRequestUrl(args: string | FetchArgs): string {
    return typeof args === "string" ? args : args.url;
}

function shouldAttemptRefresh(state: RootState): boolean {
    if (isLoggingOut()) return false;
    if (!state.auth.isAuthenticated) return false;
    if (!token.getRefresh()) return false;
    return true;
}

function handleSessionExpired(dispatch: AppDispatch): void {
    if (isLoggingOut()) return;
    if (typeof window !== "undefined" && isAuthPage(window.location.pathname)) return;

    clearAuthSession(dispatch, { resetApi: false });
    redirectToLogin();
}

async function performRefresh(
    api: Parameters<BaseQueryFn>[1],
    extraOptions: Parameters<BaseQueryFn>[2]
): Promise<boolean> {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
        try {
            const refreshToken = token.getRefresh();
            if (!refreshToken || isLoggingOut()) return false;

            const result = await rawBaseQuery(
                { url: "/auth/refresh", method: "POST", body: { refreshToken } },
                api,
                extraOptions
            );

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

    const url = getRequestUrl(args);
    if (AUTH_ENDPOINTS_SKIP_REFRESH.has(url)) return result;

    const state = api.getState() as RootState;

    // Intentional sign-out or already cleared session — do not refresh or redirect.
    if (isLoggingOut() || !shouldAttemptRefresh(state)) {
        return result;
    }

    const refreshed = await performRefresh(api, extraOptions);

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
