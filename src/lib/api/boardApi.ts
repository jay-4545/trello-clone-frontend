import { baseApi } from "./baseApi";
import type { ApiResponse } from "@/types/api.types";

export interface Board {
    id: number;
    workspaceId: number;
    createdById: number;
    name: string;
    description: string | null;
    background: string | null;
    visibility: "private" | "workspace" | "public";
    isClosed: boolean;
    isStarred: boolean;
    position: number;
    members?: BoardMember[];
    lists?: any[];
    createdAt: string;
}

export interface BoardMember {
    id: number;
    boardId: number;
    userId: number;
    role: "admin" | "member" | "viewer";
    user: { id: number; name: string; email: string; avatar: string | null };
}

export const boardApi = baseApi.injectEndpoints({
    endpoints: (build) => ({

        getBoards: build.query<ApiResponse<Board[]>, { workspaceId: number; closedOnly?: boolean } | number>({
            query: (arg) => {
                const workspaceId = typeof arg === "number" ? arg : arg.workspaceId;
                const closedOnly = typeof arg === "number" ? undefined : arg.closedOnly;
                return {
                    url: `/workspaces/${workspaceId}/boards`,
                    params: closedOnly ? { closedOnly: "true" } : undefined,
                };
            },
            providesTags: (_r, _e, arg) => {
                const workspaceId = typeof arg === "number" ? arg : arg.workspaceId;
                return [{ type: "Board", id: workspaceId }];
            },
        }),

        getBoardDetail: build.query<ApiResponse<Board>, { workspaceId: number; boardId: number }>({
            query: ({ workspaceId, boardId }) => `/workspaces/${workspaceId}/boards/${boardId}`,
            providesTags: (_r, _e, { boardId }) => [{ type: "Board", id: boardId }],
        }),

        createBoard: build.mutation<ApiResponse<Board>, { workspaceId: number; body: { name: string; description?: string; background?: string; visibility?: string } }>({
            query: ({ workspaceId, body }) => ({ url: `/workspaces/${workspaceId}/boards`, method: "POST", body }),
            invalidatesTags: (_r, _e, { workspaceId }) => [{ type: "Board", id: workspaceId }],
        }),

        updateBoard: build.mutation<ApiResponse<Board>, { workspaceId: number; boardId: number; body: Partial<Board> }>({
            query: ({ workspaceId, boardId, body }) => ({ url: `/workspaces/${workspaceId}/boards/${boardId}`, method: "PATCH", body }),
            invalidatesTags: (_r, _e, { boardId }) => [{ type: "Board", id: boardId }],
        }),

        closeBoard: build.mutation<ApiResponse<Board>, { workspaceId: number; boardId: number }>({
            query: ({ workspaceId, boardId }) => ({ url: `/workspaces/${workspaceId}/boards/${boardId}/close`, method: "POST" }),
            invalidatesTags: (_r, _e, { workspaceId }) => [{ type: "Board", id: workspaceId }],
        }),

        deleteBoard: build.mutation<ApiResponse<null>, { workspaceId: number; boardId: number }>({
            query: ({ workspaceId, boardId }) => ({ url: `/workspaces/${workspaceId}/boards/${boardId}`, method: "DELETE" }),
            invalidatesTags: (_r, _e, { workspaceId }) => [{ type: "Board", id: workspaceId }],
        }),

        getBoardMembers: build.query<ApiResponse<BoardMember[]>, { workspaceId: number; boardId: number }>({
            query: ({ workspaceId, boardId }) => `/workspaces/${workspaceId}/boards/${boardId}/members`,
            providesTags: (_r, _e, { boardId }) => [{ type: "BoardMember", id: boardId }],
        }),

        inviteBoardMember: build.mutation<ApiResponse<BoardMember>, { workspaceId: number; boardId: number; email: string; role?: string }>({
            query: ({ workspaceId, boardId, ...body }) => ({ url: `/workspaces/${workspaceId}/boards/${boardId}/members`, method: "POST", body }),
            invalidatesTags: (_r, _e, { boardId }) => [{ type: "BoardMember", id: boardId }],
        }),

        updateBoardMemberRole: build.mutation<ApiResponse<BoardMember>, { workspaceId: number; boardId: number; userId: number; role: string }>({
            query: ({ workspaceId, boardId, userId, role }) => ({ url: `/workspaces/${workspaceId}/boards/${boardId}/members/${userId}`, method: "PATCH", body: { role } }),
            invalidatesTags: (_r, _e, { boardId }) => [{ type: "BoardMember", id: boardId }],
        }),

        removeBoardMember: build.mutation<ApiResponse<null>, { workspaceId: number; boardId: number; userId: number }>({
            query: ({ workspaceId, boardId, userId }) => ({ url: `/workspaces/${workspaceId}/boards/${boardId}/members/${userId}`, method: "DELETE" }),
            invalidatesTags: (_r, _e, { boardId }) => [{ type: "BoardMember", id: boardId }],
        }),

    }),
    overrideExisting: false,
});

export const {
    useGetBoardsQuery,
    useGetBoardDetailQuery,
    useCreateBoardMutation,
    useUpdateBoardMutation,
    useCloseBoardMutation,
    useDeleteBoardMutation,
    useGetBoardMembersQuery,
    useInviteBoardMemberMutation,
    useUpdateBoardMemberRoleMutation,
    useRemoveBoardMemberMutation,
} = boardApi;