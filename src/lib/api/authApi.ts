import { baseApi } from "./baseApi";
import type { AuthResponse, LoginInput, RegisterInput, ChangePasswordInput, User } from "@/types/auth.types";
import type { ApiResponse } from "@/types/api.types";

export const authApi = baseApi.injectEndpoints({
    endpoints: (build) => ({

        register: build.mutation<ApiResponse<AuthResponse>, RegisterInput>({
            query: (body) => ({ url: "/auth/register", method: "POST", body }),
        }),

        login: build.mutation<ApiResponse<AuthResponse>, LoginInput>({
            query: (body) => ({ url: "/auth/login", method: "POST", body }),
        }),

        logout: build.mutation<ApiResponse<null>, void>({
            query: () => ({ url: "/auth/logout", method: "POST" }),
        }),

        getProfile: build.query<ApiResponse<User>, void>({
            query: () => "/auth/me",
            providesTags: ["Auth"],
        }),

        refreshToken: build.mutation<ApiResponse<{ accessToken: string; refreshToken: string }>, { refreshToken: string }>({
            query: (body) => ({ url: "/auth/refresh", method: "POST", body }),
        }),

        changePassword: build.mutation<ApiResponse<null>, ChangePasswordInput>({
            query: (body) => ({ url: "/auth/change-password", method: "PUT", body }),
        }),

        uploadAvatar: build.mutation<ApiResponse<{ avatar: string }>, FormData>({
            query: (body) => ({ url: "/auth/avatar", method: "POST", body }),
            invalidatesTags: ["Auth"],
        }),

    }),
    overrideExisting: false,
});

export const {
    useRegisterMutation,
    useLoginMutation,
    useLogoutMutation,
    useGetProfileQuery,
    useRefreshTokenMutation,
    useChangePasswordMutation,
    useUploadAvatarMutation,
} = authApi;