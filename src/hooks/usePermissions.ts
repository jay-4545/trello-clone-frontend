import type { WorkspaceRole, BoardRole } from "@/types/role.types";

export function useWorkspacePermissions(myRole?: WorkspaceRole | string) {
    const role = myRole as WorkspaceRole | undefined;
    const canManage = role === "owner" || role === "admin";
    const canCreateBoard = role === "owner" || role === "admin" || role === "member";
    const canInvite = canManage;
    const isViewer = role === "viewer";
    const isOwner = role === "owner";
    const isMember = role === "member";

    return {
        myRole: role,
        canManage,
        canCreateBoard,
        canInvite,
        isViewer,
        isOwner,
        isMember,
    };
}

/** Mirrors backend board RBAC fallbacks for workspace owner/admin/member without a board_members row. */
export function useBoardPermissions(
    wsRole?: WorkspaceRole | string,
    myBoardRole?: BoardRole | string
) {
    const workspaceRole = wsRole as WorkspaceRole | undefined;
    const boardRole = myBoardRole as BoardRole | undefined;

    const isWorkspaceOwnerOrAdmin = workspaceRole === "owner" || workspaceRole === "admin";

    const effectiveBoardRole: BoardRole | undefined =
        boardRole ??
        (workspaceRole === "owner" || workspaceRole === "admin"
            ? "admin"
            : workspaceRole === "member"
              ? "member"
              : workspaceRole === "viewer"
                ? "viewer"
                : undefined);

    const canEditBoard =
        effectiveBoardRole === "admin" || effectiveBoardRole === "member";
    const canManageBoard =
        isWorkspaceOwnerOrAdmin || effectiveBoardRole === "admin";
    const canDeleteBoard =
        effectiveBoardRole === "admin" || workspaceRole === "owner";
    const isViewOnly = !canEditBoard;

    return {
        wsRole: workspaceRole,
        myBoardRole: boardRole,
        effectiveBoardRole,
        canEditBoard,
        canManageBoard,
        canDeleteBoard,
        isViewOnly,
        isWorkspaceOwnerOrAdmin,
    };
}

export function isSystemAdmin(role?: string): boolean {
    return role === "super_admin" || role === "admin";
}

export function isSuperAdmin(role?: string): boolean {
    return role === "super_admin";
}
