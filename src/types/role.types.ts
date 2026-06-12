export type WorkspaceRole = "owner" | "admin" | "member" | "viewer";
export type BoardRole = "admin" | "member" | "viewer";
export type SystemRole = "super_admin" | "admin" | "user";

export const WORKSPACE_ROLE_LABELS: Record<WorkspaceRole, string> = {
    owner: "Owner",
    admin: "Admin",
    member: "Member",
    viewer: "Viewer",
};

export const BOARD_ROLE_LABELS: Record<BoardRole, string> = {
    admin: "Admin",
    member: "Member",
    viewer: "Viewer",
};

export const SYSTEM_ROLE_LABELS: Record<SystemRole, string> = {
    super_admin: "Super Admin",
    admin: "Admin",
    user: "User",
};

export const WORKSPACE_ROLE_VARIANT: Record<WorkspaceRole, "success" | "info" | "default" | "warning"> = {
    owner: "success",
    admin: "info",
    member: "default",
    viewer: "warning",
};

export const BOARD_ROLE_VARIANT: Record<BoardRole, "info" | "default" | "warning"> = {
    admin: "info",
    member: "default",
    viewer: "warning",
};

export const SYSTEM_ROLE_VARIANT: Record<SystemRole, "purple" | "info" | "default"> = {
    super_admin: "purple",
    admin: "info",
    user: "default",
};

export const WORKSPACE_INVITE_ROLES = [
    { value: "admin" as const, label: "Admin", desc: "Manage workspace settings and members" },
    { value: "member" as const, label: "Member", desc: "Create and edit boards" },
    { value: "viewer" as const, label: "Viewer", desc: "Read-only access to boards" },
];

export const BOARD_INVITE_ROLES = [
    { value: "admin" as const, label: "Admin", desc: "Full board access and settings" },
    { value: "member" as const, label: "Member", desc: "Can edit cards and lists" },
    { value: "viewer" as const, label: "Viewer", desc: "Read-only access" },
];

export const SYSTEM_ROLE_OPTIONS = [
    { value: "user" as const, label: "User" },
    { value: "admin" as const, label: "Admin" },
    { value: "super_admin" as const, label: "Super Admin" },
];

export function toSelectOptions<T extends { value: string; label: string; desc?: string }>(
    items: readonly T[]
) {
    return items.map((item) => ({
        value: item.value,
        label: item.label,
        description: "desc" in item ? item.desc : undefined,
    }));
}
