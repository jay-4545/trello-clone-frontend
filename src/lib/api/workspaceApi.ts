import { baseApi } from "./baseApi";
import type { ApiResponse } from "@/types/api.types";
import type { WorkspaceRole } from "@/types/role.types";

export interface Workspace {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    logo: string | null;
    ownerId: number;
    isPersonal: boolean;
    myRole?: WorkspaceRole;
    createdAt: string;
}

export interface WorkspaceMember {
    id: number;
    workspaceId: number;
    userId: number;
    role: WorkspaceRole;
    user: { id: number; name: string; email: string; avatar: string | null };
}

export const workspaceApi = baseApi.injectEndpoints({
    endpoints: (build) => ({

        getMyWorkspaces: build.query<ApiResponse<Workspace[]>, void>({
            query: () => "/workspaces",
            providesTags: ["Workspace"],
        }),

        getWorkspace: build.query<ApiResponse<Workspace>, number>({
            query: (id) => `/workspaces/${id}`,
            providesTags: (_r, _e, id) => [{ type: "Workspace", id }],
        }),

        createWorkspace: build.mutation<ApiResponse<Workspace>, { name: string; description?: string }>({
            query: (body) => ({ url: "/workspaces", method: "POST", body }),
            invalidatesTags: ["Workspace"],
        }),

        updateWorkspace: build.mutation<ApiResponse<Workspace>, { id: number; body: Partial<{ name: string; description: string }> }>({
            query: ({ id, body }) => ({ url: `/workspaces/${id}`, method: "PATCH", body }),
            invalidatesTags: (_r, _e, { id }) => [{ type: "Workspace", id }],
        }),

        deleteWorkspace: build.mutation<ApiResponse<null>, number>({
            query: (id) => ({ url: `/workspaces/${id}`, method: "DELETE" }),
            invalidatesTags: ["Workspace"],
        }),

        getWorkspaceMembers: build.query<ApiResponse<WorkspaceMember[]>, number>({
            query: (id) => `/workspaces/${id}/members`,
            providesTags: (_r, _e, id) => [{ type: "WorkspaceMember", id }],
        }),

        inviteWorkspaceMember: build.mutation<ApiResponse<WorkspaceMember>, { workspaceId: number; email: string; role?: string }>({
            query: ({ workspaceId, ...body }) => ({ url: `/workspaces/${workspaceId}/members`, method: "POST", body }),
            invalidatesTags: (_r, _e, { workspaceId }) => [{ type: "WorkspaceMember", id: workspaceId }],
        }),

        updateWorkspaceMemberRole: build.mutation<ApiResponse<WorkspaceMember>, { workspaceId: number; userId: number; role: string }>({
            query: ({ workspaceId, userId, role }) => ({ url: `/workspaces/${workspaceId}/members/${userId}`, method: "PATCH", body: { role } }),
            invalidatesTags: (_r, _e, { workspaceId }) => [{ type: "WorkspaceMember", id: workspaceId }],
        }),

        removeWorkspaceMember: build.mutation<ApiResponse<null>, { workspaceId: number; userId: number }>({
            query: ({ workspaceId, userId }) => ({ url: `/workspaces/${workspaceId}/members/${userId}`, method: "DELETE" }),
            invalidatesTags: (_r, _e, { workspaceId }) => [{ type: "WorkspaceMember", id: workspaceId }],
        }),

    }),
    overrideExisting: false,
});

export const {
    useGetMyWorkspacesQuery,
    useGetWorkspaceQuery,
    useCreateWorkspaceMutation,
    useUpdateWorkspaceMutation,
    useDeleteWorkspaceMutation,
    useGetWorkspaceMembersQuery,
    useInviteWorkspaceMemberMutation,
    useUpdateWorkspaceMemberRoleMutation,
    useRemoveWorkspaceMemberMutation,
} = workspaceApi;