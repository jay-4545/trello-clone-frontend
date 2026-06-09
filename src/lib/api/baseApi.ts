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

// Auto-refresh interceptor
const baseQueryWithReauth: BaseQueryFn<
    string | FetchArgs,
    unknown,
    FetchBaseQueryError
> = async (args, api, extraOptions) => {
    let result = await rawBaseQuery(args, api, extraOptions);

    if (result.error?.status === 401) {
        const refreshToken = token.getRefresh();
        if (refreshToken) {
            const refreshResult = await rawBaseQuery(
                { url: "/auth/refresh", method: "POST", body: { refreshToken } },
                api,
                extraOptions
            );

            if (refreshResult.data) {
                const { accessToken, refreshToken: newRefresh } = refreshResult.data as {
                    accessToken: string; refreshToken: string;
                };
                token.setTokenPair(accessToken, newRefresh);
                // Retry original request with new token
                result = await rawBaseQuery(args, api, extraOptions);
            } else {
                token.clearAll();
                api.dispatch(logout());
            }
        } else {
            token.clearAll();
            api.dispatch(logout());
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