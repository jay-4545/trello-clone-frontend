export interface AdminPageMeta {
    title: string;
    description?: string;
}

export const ADMIN_PAGE_META: Record<string, AdminPageMeta> = {
    "/admin": {
        title: "Dashboard",
        description: "Platform overview and quick access to admin tools",
    },
    "/admin/users": {
        title: "Users",
        description: "Manage accounts, roles, and access",
    },
    "/admin/workspaces": {
        title: "Workspaces",
        description: "All workspaces across the platform",
    },
    "/admin/boards": {
        title: "Boards",
        description: "All boards with visibility and status filters",
    },
    "/admin/cards": {
        title: "Cards",
        description: "All cards across boards",
    },
    "/admin/comments": {
        title: "Comments",
        description: "Review platform comments",
    },
    "/admin/error-logs": {
        title: "Error logs",
        description: "Review API, auth, validation, and socket errors with full request context",
    },
    "/admin/profile": {
        title: "My profile",
        description: "Manage your account, security, and administrator settings",
    },
    "/admin/notifications": {
        title: "Notifications",
        description: "Your admin notifications inbox",
    },
};

export function getAdminPageMeta(pathname: string): AdminPageMeta {
    if (ADMIN_PAGE_META[pathname]) return ADMIN_PAGE_META[pathname];
    const match = Object.keys(ADMIN_PAGE_META)
        .filter((k) => k !== "/admin")
        .sort((a, b) => b.length - a.length)
        .find((k) => pathname.startsWith(k));
    return match ? ADMIN_PAGE_META[match] : { title: "Admin" };
}
