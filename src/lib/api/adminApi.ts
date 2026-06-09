import { baseApi } from "./baseApi";
import type { ApiResponse, PaginationMeta } from "@/types/api.types";
import type { User } from "@/types/auth.types";

export interface SystemStats {
    totalUsers: number;
    activeUsers: number;
    totalWorkspaces: number;
    totalBoards: number;
    totalCards: number;
    totalComments: number;
}

export const adminApi = baseApi.injectEndpoints({
    endpoints: (build) => ({

        getSystemStats: build.query<ApiResponse<SystemStats>, void>({
            query: () => "/admin/stats",
            providesTags: ["AdminStats"],
        }),

        getAdminUsers: build.query<{ success: boolean; data: User[]; meta: PaginationMeta }, { page?: number; limit?: number; search?: string; role?: string }>({
            query: (params) => ({ url: "/admin/users", params }),
            providesTags: ["AdminUsers"],
        }),

        getAdminUserById: build.query<ApiResponse<User>, number>({
            query: (id) => `/admin/users/${id}`,
            providesTags: (_r, _e, id) => [{ type: "AdminUsers", id }],
        }),

        updateAdminUser: build.mutation<ApiResponse<User>, { userId: number; body: Partial<{ role: string; isActive: boolean }> }>({
            query: ({ userId, body }) => ({ url: `/admin/users/${userId}`, method: "PATCH", body }),
            invalidatesTags: ["AdminUsers"],
        }),

        deleteAdminUser: build.mutation<ApiResponse<null>, number>({
            query: (id) => ({ url: `/admin/users/${id}`, method: "DELETE" }),
            invalidatesTags: ["AdminUsers"],
        }),

        lockUser: build.mutation<ApiResponse<User>, { userId: number; minutes?: number }>({
            query: ({ userId, minutes = 30 }) => ({ url: `/admin/users/${userId}/lock`, method: "POST", body: { minutes } }),
            invalidatesTags: ["AdminUsers"],
        }),

        unlockUser: build.mutation<ApiResponse<User>, number>({
            query: (userId) => ({ url: `/admin/users/${userId}/unlock`, method: "POST" }),
            invalidatesTags: ["AdminUsers"],
        }),

    }),
    overrideExisting: false,
});

export const {
    useGetSystemStatsQuery,
    useGetAdminUsersQuery,
    useGetAdminUserByIdQuery,
    useUpdateAdminUserMutation,
    useDeleteAdminUserMutation,
    useLockUserMutation,
    useUnlockUserMutation,
} = adminApi;