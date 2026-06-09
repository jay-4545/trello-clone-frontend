import { baseApi } from "./baseApi";
import type { ApiResponse, PaginationMeta } from "@/types/api.types";

export interface Notification {
    id: number;
    userId: number;
    actorId: number | null;
    type: string;
    title: string;
    body: string;
    entityType: string;
    entityId: number;
    isRead: boolean;
    readAt: string | null;
    actor?: { id: number; name: string; avatar: string | null };
    createdAt: string;
}

export const notificationApi = baseApi.injectEndpoints({
    endpoints: (build) => ({

        getNotifications: build.query<{ success: boolean; data: Notification[]; meta: PaginationMeta }, { page?: number; limit?: number; unreadOnly?: boolean }>({
            query: (params) => ({ url: "/notifications", params }),
            providesTags: ["Notification"],
        }),

        getUnreadCount: build.query<ApiResponse<{ count: number }>, void>({
            query: () => "/notifications/unread-count",
            providesTags: ["Notification"],
        }),

        markRead: build.mutation<ApiResponse<Notification>, number>({
            query: (id) => ({ url: `/notifications/${id}/read`, method: "PATCH" }),
            invalidatesTags: ["Notification"],
        }),

        markAllRead: build.mutation<ApiResponse<{ updated: number }>, void>({
            query: () => ({ url: "/notifications/mark-all-read", method: "PATCH" }),
            invalidatesTags: ["Notification"],
        }),

        deleteNotification: build.mutation<ApiResponse<null>, number>({
            query: (id) => ({ url: `/notifications/${id}`, method: "DELETE" }),
            invalidatesTags: ["Notification"],
        }),

    }),
    overrideExisting: false,
});

export const {
    useGetNotificationsQuery,
    useGetUnreadCountQuery,
    useMarkReadMutation,
    useMarkAllReadMutation,
    useDeleteNotificationMutation,
} = notificationApi;