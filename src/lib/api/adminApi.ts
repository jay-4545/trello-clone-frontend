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

export interface AdminWorkspace {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    ownerId: number;
    isPersonal: boolean;
    createdAt: string;
    owner?: { id: number; name: string; email: string };
}

export interface AdminBoard {
    id: number;
    name: string;
    workspaceId: number;
    visibility: string;
    isClosed: boolean;
    isStarred: boolean;
    createdAt: string;
    workspace?: { id: number; name: string; slug: string };
    creator?: { id: number; name: string; email: string };
}

export interface AdminCard {
    id: number;
    title: string;
    status: string;
    priority: string;
    isArchived: boolean;
    boardId: number;
    createdAt: string;
    board?: { id: number; name: string; workspaceId: number };
    creator?: { id: number; name: string; email: string };
}

export interface AdminErrorLog {
    id: number;
    requestId: string | null;
    userId: number | null;
    level: "error" | "warning";
    source: string;
    method: string;
    path: string;
    statusCode: number;
    errorName: string | null;
    message: string;
    stack: string | null;
    isOperational: boolean;
    responseMessage: string | null;
    validationErrors: string[] | null;
    ip: string | null;
    userAgent: string | null;
    query: Record<string, unknown> | null;
    body: Record<string, unknown> | null;
    context: Record<string, unknown> | null;
    durationMs: number | null;
    createdAt: string;
    user?: { id: number; name: string; email: string; role?: string };
}

export interface ErrorLogStats {
    total: number;
    last24h: number;
    serverErrors24h: number;
    warnings24h: number;
}

export interface AdminComment {
    id: number;
    content: string;
    cardId: number;
    userId: number;
    isDeleted: boolean;
    isEdited: boolean;
    createdAt: string;
    author?: { id: number; name: string; email: string };
    card?: { id: number; title: string; boardId: number };
}

type PaginatedParams = {
    page?: number;
    limit?: number;
    search?: string;
    [key: string]: string | number | undefined;
};

type PaginatedResult<T> = { success: boolean; data: T[]; meta: PaginationMeta };

export const adminApi = baseApi.injectEndpoints({
    endpoints: (build) => ({

        getSystemStats: build.query<ApiResponse<SystemStats>, void>({
            query: () => "/admin/stats",
            providesTags: ["AdminStats"],
        }),

        getAdminUsers: build.query<PaginatedResult<User>, PaginatedParams>({
            query: (params) => ({ url: "/admin/users", params }),
            providesTags: ["AdminUsers"],
        }),

        getAdminWorkspaces: build.query<PaginatedResult<AdminWorkspace>, PaginatedParams>({
            query: (params) => ({ url: "/admin/workspaces", params }),
            providesTags: ["AdminWorkspaces"],
        }),

        getAdminBoards: build.query<PaginatedResult<AdminBoard>, PaginatedParams>({
            query: (params) => ({ url: "/admin/boards", params }),
            providesTags: ["AdminBoards"],
        }),

        getAdminCards: build.query<PaginatedResult<AdminCard>, PaginatedParams>({
            query: (params) => ({ url: "/admin/cards", params }),
            providesTags: ["AdminCards"],
        }),

        getAdminComments: build.query<PaginatedResult<AdminComment>, PaginatedParams>({
            query: (params) => ({ url: "/admin/comments", params }),
            providesTags: ["AdminComments"],
        }),

        getAdminErrorLogs: build.query<PaginatedResult<AdminErrorLog>, PaginatedParams>({
            query: (params) => ({ url: "/admin/error-logs", params }),
            providesTags: ["AdminErrorLogs"],
        }),

        getAdminErrorLogById: build.query<ApiResponse<AdminErrorLog>, number>({
            query: (id) => `/admin/error-logs/${id}`,
            providesTags: (_r, _e, id) => [{ type: "AdminErrorLogs", id }],
        }),

        getAdminErrorLogStats: build.query<ApiResponse<ErrorLogStats>, void>({
            query: () => "/admin/error-logs/stats",
            providesTags: ["AdminErrorLogs"],
        }),

        getAdminUserById: build.query<ApiResponse<User>, number>({
            query: (id) => `/admin/users/${id}`,
            providesTags: (_r, _e, id) => [{ type: "AdminUsers", id }],
        }),

        updateAdminUser: build.mutation<ApiResponse<User>, { userId: number; body: Partial<{ role: string; isActive: boolean }> }>({
            query: ({ userId, body }) => ({ url: `/admin/users/${userId}`, method: "PATCH", body }),
            invalidatesTags: ["AdminUsers", "AdminStats"],
        }),

        deleteAdminUser: build.mutation<ApiResponse<null>, number>({
            query: (id) => ({ url: `/admin/users/${id}`, method: "DELETE" }),
            invalidatesTags: ["AdminUsers", "AdminStats"],
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
    useGetAdminWorkspacesQuery,
    useGetAdminBoardsQuery,
    useGetAdminCardsQuery,
    useGetAdminCommentsQuery,
    useGetAdminErrorLogsQuery,
    useGetAdminErrorLogByIdQuery,
    useGetAdminErrorLogStatsQuery,
    useGetAdminUserByIdQuery,
    useUpdateAdminUserMutation,
    useDeleteAdminUserMutation,
    useLockUserMutation,
    useUnlockUserMutation,
} = adminApi;
