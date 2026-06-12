"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    ChevronLeft,
    ChevronRight,
    Bell,
    LogOut,
    User,
    Plus,
    Loader2,
    Briefcase,
    Menu,
    X,
    Shield,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/utils/cn";
import Avatar from "@/components/ui/Avatar";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useAppDispatch } from "@/store";
import { performLogout } from "@/store/authSession";
import { useLogoutMutation, useGetProfileQuery } from "@/lib/api/authApi";
import { useGetMyWorkspacesQuery } from "@/lib/api/workspaceApi";
import { useGetUnreadCountQuery } from "@/lib/api/notificationApi";
import { useNotificationSocket } from "@/lib/socket/useNotificationSocket";
import { useAuthToken } from "@/hooks/useAuthToken";
import { isSystemAdmin } from "@/hooks/usePermissions";
import RoleBadge from "@/components/roles/RoleBadge";

interface AppShellProps {
    children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
    const router = useRouter();
    const pathname = usePathname();
    const dispatch = useAppDispatch();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [confirmSignOut, setConfirmSignOut] = useState(false);

    const hasToken = useAuthToken();

    const { data: profileData } = useGetProfileQuery(undefined, { skip: !hasToken });
    const { data: workspacesData, isLoading: loadingWs } = useGetMyWorkspacesQuery(undefined, { skip: !hasToken });
    const { data: unreadData } = useGetUnreadCountQuery(undefined, { skip: !hasToken });
    const [logoutMutation, { isLoading: loggingOut }] = useLogoutMutation();

    useNotificationSocket(hasToken);

    const user = profileData?.data;
    const workspaces = workspacesData?.data ?? [];
    const unreadCount = unreadData?.data?.count ?? 0;
    const showAdminNav = isSystemAdmin(user?.role);
    const profileHref = showAdminNav ? "/admin/profile" : "/profile";

    const handleLogout = async () => {
        await performLogout(dispatch, () => logoutMutation().unwrap());
        toast.success("Signed out successfully");
        router.replace("/login");
    };

    useEffect(() => {
        const handler = () => setUserMenuOpen(false);
        if (userMenuOpen) document.addEventListener("click", handler);
        return () => document.removeEventListener("click", handler);
    }, [userMenuOpen]);

    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    return (
        <div className="flex h-screen bg-slate-100 overflow-hidden">
            {/* Mobile top bar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-[#0F172A] border-b border-slate-800 flex items-center justify-between px-4 shadow-sm">
                <button
                    onClick={() => setMobileOpen(true)}
                    className="flex items-center justify-center h-9 w-9 rounded-lg hover:bg-white/10 text-slate-200"
                    aria-label="Open menu"
                >
                    <Menu className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-7 w-7 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm">
                        <LayoutDashboard className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-sm font-bold text-white">Taskboard</span>
                </div>

                <Link
                    href={profileHref}
                    className="flex items-center justify-center h-9 w-9 rounded-lg hover:bg-white/10"
                    aria-label="Profile"
                >
                    {user ? (
                        <Avatar src={user.avatar} name={user.name} size="sm" />
                    ) : (
                        <User className="h-5 w-5 text-slate-200" />
                    )}
                </Link>
            </div>

            {mobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-in fade-in-0"
                    onClick={() => setMobileOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar — Trello-style dark navy */}
            <aside
                className={cn(
                    "flex flex-col bg-gradient-to-b from-[#0F172A] via-[#111A2E] to-[#0F172A] border-r border-slate-800 transition-all duration-300 shrink-0 z-50 text-slate-200",
                    "lg:relative",
                    collapsed ? "lg:w-16" : "lg:w-60",
                    "fixed inset-y-0 left-0 w-64",
                    mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                {/* Logo */}
                <div
                    className={cn(
                        "flex items-center gap-2.5 px-4 h-14 border-b border-slate-800/70 shrink-0",
                        collapsed && "lg:justify-center lg:px-0"
                    )}
                >
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shrink-0 shadow-md shadow-blue-900/40">
                        <LayoutDashboard className="h-4 w-4 text-white" />
                    </div>
                    {(!collapsed || mobileOpen) && (
                        <span className={cn(
                            "text-sm font-bold text-white tracking-tight",
                            collapsed && "lg:hidden"
                        )}>
                            Taskboard
                        </span>
                    )}
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="lg:hidden ml-auto flex items-center justify-center h-8 w-8 rounded hover:bg-white/10 text-slate-300"
                        aria-label="Close menu"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin">
                    {/* Workspaces heading */}
                    {(!collapsed || mobileOpen) && (
                        <div className={cn(
                            "flex items-center justify-between px-2 py-1.5 mb-1",
                            collapsed && "lg:hidden"
                        )}>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Workspaces
                            </span>
                            <Link
                                href="/workspaces/create"
                                className="flex items-center justify-center h-5 w-5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                title="New workspace"
                            >
                                <Plus className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                    )}

                    {collapsed && !mobileOpen && (
                        <Link
                            href="/workspaces/create"
                            className="hidden lg:flex items-center justify-center h-9 w-full rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors mb-1"
                            title="New workspace"
                        >
                            <Plus className="h-4 w-4" />
                        </Link>
                    )}

                    {loadingWs ? (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                        </div>
                    ) : (
                        workspaces.map((ws) => {
                            const isActive = pathname.startsWith(`/workspaces/${ws.id}`);
                            return (
                                <Link
                                    key={ws.id}
                                    href={`/workspaces/${ws.id}`}
                                    className={cn(
                                        "flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-all group relative",
                                        isActive
                                            ? "bg-blue-500/15 text-white font-medium"
                                            : "text-slate-300 hover:bg-white/5 hover:text-white"
                                    )}
                                    title={ws.name}
                                >
                                    {isActive && (
                                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-blue-400 rounded-r" />
                                    )}
                                    <div
                                        className="h-6 w-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-sm"
                                        style={{ background: `hsl(${(ws.id * 47) % 360}, 65%, 50%)` }}
                                    >
                                        {ws.name[0].toUpperCase()}
                                    </div>
                                    {(!collapsed || mobileOpen) && (
                                        <div className={cn("min-w-0 flex-1", collapsed && "lg:hidden")}>
                                            <span className="truncate block text-sm">{ws.name}</span>
                                            {ws.myRole && ws.myRole !== "member" && (
                                                <RoleBadge
                                                    role={ws.myRole}
                                                    scope="workspace"
                                                    className="mt-0.5 !text-[10px] !px-1.5 !py-0"
                                                />
                                            )}
                                        </div>
                                    )}
                                </Link>
                            );
                        })
                    )}

                    {workspaces.length === 0 && !loadingWs && (
                        <div className={cn(
                            "text-xs text-slate-500 px-2 py-2 italic",
                            collapsed && "lg:hidden"
                        )}>
                            No workspaces yet
                        </div>
                    )}

                    <div className="my-3 border-t border-slate-800/70" />

                    <SidebarLink
                        href="/workspaces"
                        icon={<Briefcase className="h-4 w-4" />}
                        label="All Workspaces"
                        collapsed={collapsed && !mobileOpen}
                        active={pathname === "/workspaces"}
                    />
                    {showAdminNav && (
                        <SidebarLink
                            href="/admin"
                            icon={<Shield className="h-4 w-4" />}
                            label="Admin"
                            collapsed={collapsed && !mobileOpen}
                            active={pathname.startsWith("/admin")}
                        />
                    )}
                    <SidebarLink
                        href="/notifications"
                        icon={
                            <div className="relative">
                                <Bell className="h-4 w-4" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold ring-2 ring-[#0F172A]">
                                        {unreadCount > 9 ? "9+" : unreadCount}
                                    </span>
                                )}
                            </div>
                        }
                        label="Notifications"
                        collapsed={collapsed && !mobileOpen}
                        active={pathname === "/notifications"}
                    />
                    <SidebarLink
                        href={profileHref}
                        icon={<User className="h-4 w-4" />}
                        label="Profile"
                        collapsed={collapsed && !mobileOpen}
                        active={pathname === profileHref}
                    />
                </nav>

                {/* User footer */}
                <div className={cn(
                    "border-t border-slate-800/70 p-2 shrink-0",
                    collapsed && !mobileOpen && "lg:px-1"
                )}>
                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setUserMenuOpen((v) => !v);
                            }}
                            className={cn(
                                "w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors",
                                collapsed && !mobileOpen && "lg:justify-center lg:px-0"
                            )}
                        >
                            {user ? (
                                <Avatar src={user.avatar} name={user.name} size="sm" />
                            ) : (
                                <div className="h-8 w-8 rounded-full bg-slate-700 animate-pulse shrink-0" />
                            )}
                            {(!collapsed || mobileOpen) && user && (
                                <div className={cn(
                                    "text-left min-w-0 flex-1",
                                    collapsed && "lg:hidden"
                                )}>
                                    <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                                </div>
                            )}
                        </button>

                        {userMenuOpen && (
                            <div
                                className={cn(
                                    "absolute bottom-full mb-1 bg-white border border-slate-200 rounded-xl shadow-2xl py-1 z-50 w-52 animate-in fade-in-0 slide-in-from-bottom-2 duration-150",
                                    collapsed && !mobileOpen
                                        ? "lg:left-full lg:ml-2 lg:bottom-0 left-0 right-0"
                                        : "left-0 right-0"
                                )}
                            >
                                <div className="px-3 py-2 border-b border-slate-100">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-xs font-semibold text-slate-800 truncate">{user?.name}</p>
                                        {user?.role && user.role !== "user" && (
                                            <RoleBadge role={user.role} scope="system" />
                                        )}
                                    </div>
                                    <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                                </div>
                                <Link
                                    href={profileHref}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                    onClick={() => setUserMenuOpen(false)}
                                >
                                    <User className="h-4 w-4" />
                                    Profile
                                </Link>
                                <button
                                    onClick={() => {
                                        setUserMenuOpen(false);
                                        setConfirmSignOut(true);
                                    }}
                                    disabled={loggingOut}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    {loggingOut ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <LogOut className="h-4 w-4" />
                                    )}
                                    Sign out
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Desktop collapse toggle */}
                <button
                    onClick={() => setCollapsed((v) => !v)}
                    className="hidden lg:flex absolute top-1/2 -translate-y-1/2 -right-3 z-20 items-center justify-center h-6 w-6 rounded-full bg-white border border-slate-200 shadow-md hover:shadow-lg transition-shadow text-slate-500 hover:text-slate-700"
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
                </button>
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto min-h-0 pt-14 lg:pt-0 bg-slate-100">
                {children}
            </main>

            {/* Sign-out confirmation */}
            <ConfirmDialog
                open={confirmSignOut}
                onClose={() => setConfirmSignOut(false)}
                onConfirm={async () => {
                    await handleLogout();
                    setConfirmSignOut(false);
                }}
                loading={loggingOut}
                title="Sign out of Taskboard?"
                description="You'll need to sign in again to access your workspaces and boards."
                confirmLabel="Sign out"
                cancelLabel="Stay signed in"
            />
        </div>
    );
}

function SidebarLink({
    href,
    icon,
    label,
    collapsed,
    active,
}: {
    href: string;
    icon: React.ReactNode;
    label: string;
    collapsed: boolean;
    active: boolean;
}) {
    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-all relative",
                active
                    ? "bg-blue-500/15 text-white font-medium"
                    : "text-slate-300 hover:bg-white/5 hover:text-white",
                collapsed && "lg:justify-center"
            )}
            title={collapsed ? label : undefined}
        >
            {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-blue-400 rounded-r" />
            )}
            <span className="shrink-0">{icon}</span>
            <span className={cn(collapsed && "lg:hidden")}>{label}</span>
        </Link>
    );
}
