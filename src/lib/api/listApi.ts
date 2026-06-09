import { baseApi } from "./baseApi";
import type { ApiResponse } from "@/types/api.types";

export interface List {
    id: number;
    boardId: number;
    name: string;
    position: number;
    isArchived: boolean;
    cards?: any[];
}

export const listApi = baseApi.injectEndpoints({
    endpoints: (build) => ({

        getLists: build.query<ApiResponse<List[]>, { workspaceId: number; boardId: number }>({
            query: ({ workspaceId, boardId }) => `/workspaces/${workspaceId}/boards/${boardId}/lists`,
            providesTags: (_r, _e, { boardId }) => [{ type: "List", id: boardId }],
        }),

        createList: build.mutation<ApiResponse<List>, { workspaceId: number; boardId: number; name: string }>({
            query: ({ workspaceId, boardId, name }) => ({ url: `/workspaces/${workspaceId}/boards/${boardId}/lists`, method: "POST", body: { name } }),
            invalidatesTags: (_r, _e, { boardId }) => [{ type: "List", id: boardId }],
        }),

        updateList: build.mutation<ApiResponse<List>, { workspaceId: number; boardId: number; listId: number; name: string }>({
            query: ({ workspaceId, boardId, listId, name }) => ({ url: `/workspaces/${workspaceId}/boards/${boardId}/lists/${listId}`, method: "PATCH", body: { name } }),
            invalidatesTags: (_r, _e, { boardId }) => [{ type: "List", id: boardId }],
        }),

        archiveList: build.mutation<ApiResponse<List>, { workspaceId: number; boardId: number; listId: number }>({
            query: ({ workspaceId, boardId, listId }) => ({ url: `/workspaces/${workspaceId}/boards/${boardId}/lists/${listId}/archive`, method: "POST" }),
            invalidatesTags: (_r, _e, { boardId }) => [{ type: "List", id: boardId }],
        }),

        deleteList: build.mutation<ApiResponse<null>, { workspaceId: number; boardId: number; listId: number }>({
            query: ({ workspaceId, boardId, listId }) => ({ url: `/workspaces/${workspaceId}/boards/${boardId}/lists/${listId}`, method: "DELETE" }),
            invalidatesTags: (_r, _e, { boardId }) => [{ type: "List", id: boardId }],
        }),

        reorderLists: build.mutation<ApiResponse<null>, { workspaceId: number; boardId: number; orderedIds: number[] }>({
            query: ({ workspaceId, boardId, orderedIds }) => ({ url: `/workspaces/${workspaceId}/boards/${boardId}/lists/reorder`, method: "PATCH", body: { orderedIds } }),
            invalidatesTags: (_r, _e, { boardId }) => [{ type: "List", id: boardId }],
        }),

    }),
    overrideExisting: false,
});

export const {
    useGetListsQuery,
    useCreateListMutation,
    useUpdateListMutation,
    useArchiveListMutation,
    useDeleteListMutation,
    useReorderListsMutation,
} = listApi;