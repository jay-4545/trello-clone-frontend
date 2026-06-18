import { baseApi } from "./baseApi";
import type { ApiResponse, PaginationMeta } from "@/types/api.types";
import type { Card, CreateCardInput, UpdateCardInput, MoveCardInput, BulkMoveInput, CardStats } from "@/types/card.types";

interface GetCardsParams {
    workspaceId: number;
    boardId: number;
    listId: number;
    page?: number;
    limit?: number;
    search?: string;
    priority?: string;
    assigneeId?: number;
}

interface GetCardsResponse {
    success: boolean;
    message: string;
    data: Card[];
    meta: PaginationMeta;
}

export const cardApi = baseApi.injectEndpoints({
    endpoints: (build) => ({

        getCards: build.query<GetCardsResponse, GetCardsParams>({
            query: ({ workspaceId, boardId, listId, ...params }) => ({
                url: `/workspaces/${workspaceId}/boards/${boardId}/lists/${listId}/cards`,
                params,
            }),
            providesTags: (_r, _e, { listId }) => [{ type: "Card", id: `list-${listId}` }],
        }),

        getCard: build.query<ApiResponse<Card>, { workspaceId: number; boardId: number; listId: number; cardId: number }>({
            query: ({ workspaceId, boardId, listId, cardId }) =>
                `/workspaces/${workspaceId}/boards/${boardId}/lists/${listId}/cards/${cardId}`,
            providesTags: (_r, _e, { cardId }) => [{ type: "Card", id: cardId }],
        }),

        createCard: build.mutation<ApiResponse<Card>, { workspaceId: number; boardId: number; listId: number; body: CreateCardInput }>({
            query: ({ workspaceId, boardId, listId, body }) => ({
                url: `/workspaces/${workspaceId}/boards/${boardId}/lists/${listId}/cards`,
                method: "POST",
                body,
            }),
            invalidatesTags: (_r, _e, { listId }) => [{ type: "Card", id: `list-${listId}` }],
        }),

        updateCard: build.mutation<ApiResponse<Card>, { workspaceId: number; boardId: number; listId: number; cardId: number; body: UpdateCardInput }>({
            query: ({ workspaceId, boardId, listId, cardId, body }) => ({
                url: `/workspaces/${workspaceId}/boards/${boardId}/lists/${listId}/cards/${cardId}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: (_r, _e, { cardId, listId }) => [
                { type: "Card", id: cardId },
                { type: "Card", id: `list-${listId}` },
            ],
        }),

        moveCard: build.mutation<ApiResponse<Card>, { workspaceId: number; boardId: number; listId: number; cardId: number; body: MoveCardInput }>({
            query: ({ workspaceId, boardId, listId, cardId, body }) => ({
                url: `/workspaces/${workspaceId}/boards/${boardId}/lists/${listId}/cards/${cardId}/move`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: (_r, _e, { listId, cardId, body }) => [
                { type: "Card", id: cardId },
                { type: "Card", id: `list-${listId}` },
                { type: "Card", id: `list-${body.targetListId}` },
            ],
        }),

        reorderCards: build.mutation<ApiResponse<null>, { workspaceId: number; boardId: number; listId: number; orderedIds: number[] }>({
            query: ({ workspaceId, boardId, listId, orderedIds }) => ({
                url: `/workspaces/${workspaceId}/boards/${boardId}/lists/${listId}/cards/reorder`,
                method: "PATCH",
                body: { orderedIds },
            }),
            invalidatesTags: (_r, _e, { listId }) => [{ type: "Card", id: `list-${listId}` }],
        }),

        deleteCard: build.mutation<ApiResponse<null>, { workspaceId: number; boardId: number; listId: number; cardId: number }>({
            query: ({ workspaceId, boardId, listId, cardId }) => ({
                url: `/workspaces/${workspaceId}/boards/${boardId}/lists/${listId}/cards/${cardId}`,
                method: "DELETE",
            }),
            invalidatesTags: (_r, _e, { boardId, listId, cardId }) => [
                { type: "Card", id: `list-${listId}` },
                { type: "Card", id: cardId },
                { type: "List", id: boardId },
                { type: "Card", id: `archived-${boardId}` },
            ],
        }),

        archiveCard: build.mutation<ApiResponse<null>, { workspaceId: number; boardId: number; listId: number; cardId: number }>({
            query: ({ workspaceId, boardId, listId, cardId }) => ({
                url: `/workspaces/${workspaceId}/boards/${boardId}/lists/${listId}/cards/${cardId}/archive`,
                method: "POST",
            }),
            invalidatesTags: (_r, _e, { boardId, listId, cardId }) => [
                { type: "Card", id: `list-${listId}` },
                { type: "Card", id: cardId },
                { type: "List", id: boardId },
                { type: "Card", id: `archived-${boardId}` },
            ],
        }),

        restoreCard: build.mutation<ApiResponse<Card>, { workspaceId: number; boardId: number; listId: number; cardId: number }>({
            query: ({ workspaceId, boardId, listId, cardId }) => ({
                url: `/workspaces/${workspaceId}/boards/${boardId}/lists/${listId}/cards/${cardId}/restore`,
                method: "POST",
            }),
            invalidatesTags: (_r, _e, { listId, boardId }) => [
                { type: "Card", id: `list-${listId}` },
                { type: "Card", id: `archived-${boardId}` },
                { type: "List", id: boardId },
            ],
        }),

        assignUser: build.mutation<ApiResponse<any>, { workspaceId: number; boardId: number; listId: number; cardId: number; userId: number }>({
            query: ({ workspaceId, boardId, listId, cardId, userId }) => ({
                url: `/workspaces/${workspaceId}/boards/${boardId}/lists/${listId}/cards/${cardId}/assignees`,
                method: "POST",
                body: { userId },
            }),
            invalidatesTags: (_r, _e, { cardId }) => [{ type: "Card", id: cardId }],
        }),

        unassignUser: build.mutation<ApiResponse<null>, { workspaceId: number; boardId: number; listId: number; cardId: number; userId: number }>({
            query: ({ workspaceId, boardId, listId, cardId, userId }) => ({
                url: `/workspaces/${workspaceId}/boards/${boardId}/lists/${listId}/cards/${cardId}/assignees/${userId}`,
                method: "DELETE",
            }),
            invalidatesTags: (_r, _e, { cardId }) => [{ type: "Card", id: cardId }],
        }),

        addChecklistItem: build.mutation<ApiResponse<any>, { workspaceId: number; boardId: number; listId: number; cardId: number; text: string }>({
            query: ({ workspaceId, boardId, listId, cardId, text }) => ({
                url: `/workspaces/${workspaceId}/boards/${boardId}/lists/${listId}/cards/${cardId}/checklist`,
                method: "POST",
                body: { text },
            }),
            invalidatesTags: (_r, _e, { cardId }) => [{ type: "Card", id: cardId }],
        }),

        updateChecklistItem: build.mutation<ApiResponse<any>, { workspaceId: number; boardId: number; listId: number; cardId: number; itemId: string; text?: string; completed?: boolean }>({
            query: ({ workspaceId, boardId, listId, cardId, itemId, ...body }) => ({
                url: `/workspaces/${workspaceId}/boards/${boardId}/lists/${listId}/cards/${cardId}/checklist/${itemId}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: (_r, _e, { cardId }) => [{ type: "Card", id: cardId }],
        }),

        deleteChecklistItem: build.mutation<ApiResponse<null>, { workspaceId: number; boardId: number; listId: number; cardId: number; itemId: string }>({
            query: ({ workspaceId, boardId, listId, cardId, itemId }) => ({
                url: `/workspaces/${workspaceId}/boards/${boardId}/lists/${listId}/cards/${cardId}/checklist/${itemId}`,
                method: "DELETE",
            }),
            invalidatesTags: (_r, _e, { cardId }) => [{ type: "Card", id: cardId }],
        }),

        uploadCoverImage: build.mutation<ApiResponse<{ coverImage: string }>, { workspaceId: number; boardId: number; listId: number; cardId: number; file: FormData }>({
            query: ({ workspaceId, boardId, listId, cardId, file }) => ({
                url: `/workspaces/${workspaceId}/boards/${boardId}/lists/${listId}/cards/${cardId}/cover`,
                method: "POST",
                body: file,
            }),
            invalidatesTags: (_r, _e, { cardId }) => [{ type: "Card", id: cardId }],
        }),

        searchCards: build.query<ApiResponse<Card[]>, { workspaceId: number; boardId: number; q: string }>({
            query: ({ workspaceId, boardId, q }) => ({
                url: `/workspaces/${workspaceId}/boards/${boardId}/cards/search`,
                params: { q },
            }),
        }),

        getBoardStats: build.query<ApiResponse<CardStats>, { workspaceId: number; boardId: number }>({
            query: ({ workspaceId, boardId }) => `/workspaces/${workspaceId}/boards/${boardId}/cards/stats`,
        }),

        bulkMoveCards: build.mutation<ApiResponse<{ moved: number }>, { workspaceId: number; boardId: number; body: BulkMoveInput }>({
            query: ({ workspaceId, boardId, body }) => ({
                url: `/workspaces/${workspaceId}/boards/${boardId}/cards/bulk/move`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Card"],
        }),

        getArchivedCards: build.query<ApiResponse<Card[]>, { workspaceId: number; boardId: number }>({
            query: ({ workspaceId, boardId }) =>
                `/workspaces/${workspaceId}/boards/${boardId}/cards/archived`,
            providesTags: (_r, _e, { boardId }) => [{ type: "Card", id: `archived-${boardId}` }],
        }),

        uploadAttachment: build.mutation<ApiResponse<{ attachments: string[] }>, { workspaceId: number; boardId: number; listId: number; cardId: number; file: FormData }>({
            query: ({ workspaceId, boardId, listId, cardId, file }) => ({
                url: `/workspaces/${workspaceId}/boards/${boardId}/lists/${listId}/cards/${cardId}/attachments`,
                method: "POST",
                body: file,
            }),
            invalidatesTags: (_r, _e, { cardId }) => [{ type: "Card", id: cardId }],
        }),

        deleteAttachment: build.mutation<ApiResponse<{ attachments: string[] }>, { workspaceId: number; boardId: number; listId: number; cardId: number; index: number }>({
            query: ({ workspaceId, boardId, listId, cardId, index }) => ({
                url: `/workspaces/${workspaceId}/boards/${boardId}/lists/${listId}/cards/${cardId}/attachments/${index}`,
                method: "DELETE",
            }),
            invalidatesTags: (_r, _e, { cardId }) => [{ type: "Card", id: cardId }],
        }),

        toggleWatch: build.mutation<ApiResponse<{ isWatched: boolean }>, { workspaceId: number; boardId: number; listId: number; cardId: number }>({
            query: ({ workspaceId, boardId, listId, cardId }) => ({
                url: `/workspaces/${workspaceId}/boards/${boardId}/lists/${listId}/cards/${cardId}/watch`,
                method: "PATCH",
            }),
            invalidatesTags: (_r, _e, { cardId }) => [{ type: "Card", id: cardId }],
        }),

    }),
    overrideExisting: false,
});

export const {
    useGetCardsQuery,
    useGetCardQuery,
    useCreateCardMutation,
    useUpdateCardMutation,
    useMoveCardMutation,
    useReorderCardsMutation,
    useDeleteCardMutation,
    useArchiveCardMutation,
    useRestoreCardMutation,
    useAssignUserMutation,
    useUnassignUserMutation,
    useAddChecklistItemMutation,
    useUpdateChecklistItemMutation,
    useDeleteChecklistItemMutation,
    useUploadCoverImageMutation,
    useSearchCardsQuery,
    useGetBoardStatsQuery,
    useBulkMoveCardsMutation,
    useGetArchivedCardsQuery,
    useUploadAttachmentMutation,
    useDeleteAttachmentMutation,
    useToggleWatchMutation,
} = cardApi;