import { baseApi } from "./baseApi";
import type { ApiResponse } from "@/types/api.types";

export interface Comment {
    id: number;
    cardId: number;
    userId: number;
    parentId: number | null;
    content: string;
    mentions: number[];
    isEdited: boolean;
    isDeleted: boolean;
    author: { id: number; name: string; email: string; avatar: string | null };
    replies?: Comment[];
    createdAt: string;
    updatedAt: string;
}

export const commentApi = baseApi.injectEndpoints({
    endpoints: (build) => ({

        getComments: build.query<ApiResponse<Comment[]>, { workspaceId: number; boardId: number; cardId: number }>({
            query: ({ workspaceId, boardId, cardId }) =>
                `/workspaces/${workspaceId}/boards/${boardId}/cards/${cardId}/comments`,
            providesTags: (_r, _e, { cardId }) => [{ type: "Comment", id: cardId }],
        }),

        createComment: build.mutation<ApiResponse<Comment>, { workspaceId: number; boardId: number; cardId: number; content: string; parentId?: number }>({
            query: ({ workspaceId, boardId, cardId, ...body }) => ({
                url: `/workspaces/${workspaceId}/boards/${boardId}/cards/${cardId}/comments`,
                method: "POST",
                body,
            }),
            invalidatesTags: (_r, _e, { cardId }) => [{ type: "Comment", id: cardId }],
        }),

        updateComment: build.mutation<ApiResponse<Comment>, { workspaceId: number; boardId: number; cardId: number; commentId: number; content: string }>({
            query: ({ workspaceId, boardId, cardId, commentId, content }) => ({
                url: `/workspaces/${workspaceId}/boards/${boardId}/cards/${cardId}/comments/${commentId}`,
                method: "PATCH",
                body: { content },
            }),
            invalidatesTags: (_r, _e, { cardId }) => [{ type: "Comment", id: cardId }],
        }),

        deleteComment: build.mutation<ApiResponse<null>, { workspaceId: number; boardId: number; cardId: number; commentId: number }>({
            query: ({ workspaceId, boardId, cardId, commentId }) => ({
                url: `/workspaces/${workspaceId}/boards/${boardId}/cards/${cardId}/comments/${commentId}`,
                method: "DELETE",
            }),
            invalidatesTags: (_r, _e, { cardId }) => [{ type: "Comment", id: cardId }],
        }),

    }),
    overrideExisting: false,
});

export const {
    useGetCommentsQuery,
    useCreateCommentMutation,
    useUpdateCommentMutation,
    useDeleteCommentMutation,
} = commentApi;