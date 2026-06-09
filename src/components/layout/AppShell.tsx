// src/components/layout/AppShell.tsx
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
    Settings,
    Plus,
    Loader2,
    Check,
    Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/utils/cn";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import { useAppDispatch, useAppSelector } from "@/store";
import { logout } from "@/store/slices/authSlice";
import { useLogoutMutation, useGetProfileQuery } from "@/lib/api/authApi";
import { useGetMyWorkspacesQuery } from "@/lib/api/workspaceApi";
import { useGetUnreadCountQuery } from "@/lib/api/notificationApi";
import { parseApiError } from "@/utils/errorParser";

interface AppShellProps {
    children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
    const router = useRouter();
    const pathname = usePathname();
    const dispatch = useAppDispatch();
    const [collapsed, setCollapsed] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const { data: profileData } = useGetProfileQuery();
    const { data: workspacesData, isLoading: loadingWs } = useGetMyWorkspacesQuery();
    const { data: unreadData } = useGetUnreadCountQuery();
    const [logoutMutation, { isLoading: loggingOut }] = useLogoutMutation();

    const user = profileData?.data;
    const workspaces = workspacesData?.data ?? [];
    const unreadCount = unreadData?.data?.count ?? 0;

    const handleLogout = async () => {
        try {
            await logoutMutation().unwrap();
        } catch {
            // Ignore logout errors — clear locally anyway
        }
        dispatch(logout());
        toast.success("Signed out successfully");
        router.replace("/login");
    };

    // Close user menu on outside click
    useEffect(() => {
        const handler = () => setUserMenuOpen(false);
        if (userMenuOpen) document.addEventListener("click", handler);
        return () => document.removeEventListener("click", handler);
    }, [userMenuOpen]);

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Sidebar */}
            <aside
                className={cn(
                    "flex flex-col bg-white border-r border-slate-200 transition-all duration-300 shrink-0",
                    collapsed ? "w-16" : "w-60"
                )}
            >
                {/* Logo */}
                <div className={cn("flex items-center gap-2.5 px-4 h-14 border-b border-slate-100", collapsed && "justify-center px-0")}>
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-blue-600 shrink-0">
                        <LayoutDashboard className="h-4 w-4 text-white" />
                    </div>
                    {!collapsed && (
                        <span className="text-sm font-bold text-slate-900 tracking-tight">Taskboard</span>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
                    {/* Workspaces heading */}
                    {!collapsed && (
                        <div className="flex items-center justify-between px-2 py-1.5 mb-1">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Workspaces</span>
                            <Link
                                href="/workspaces/create"
                                className="flex items-center justify-center h-5 w-5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                title="New workspace"
                            >
                                <Plus className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                    )}

                    {collapsed && (
                        <Link
                            href="/workspaces/create"
                            className="flex items-center justify-center h-9 w-full rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors mb-1"
                            title="New workspace"
                        >
                            <Plus className="h-4 w-4" />
                        </Link>
                    )}

                    {loadingWs ? (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-4 w-4 animate-spin text-slate-300" />
                        </div>
                    ) : (
                        workspaces.map((ws) => {
                            const isActive = pathname.startsWith(`/workspaces/${ws.id}`);
                            return (
                                <Link
                                    key={ws.id}
                                    href={`/workspaces/${ws.id}`}
                                    className={cn(
                                        "flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors group",
                                        isActive
                                            ? "bg-blue-50 text-blue-700 font-medium"
                                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                    )}
                                    title={ws.name}
                                >
                                    <div
                                        className="h-6 w-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                                        style={{ background: `hsl(${(ws.id * 47) % 360}, 65%, 55%)` }}
                                    >
                                        {ws.name[0].toUpperCase()}
                                    </div>
                                    {!collapsed && (
                                        <span className="truncate flex-1">{ws.name}</span>
                                    )}
                                </Link>
                            );
                        })
                    )}

                    {workspaces.length === 0 && !loadingWs && (
                        <div className={cn("text-xs text-slate-400 px-2 py-2", collapsed && "hidden")}>
                            No workspaces yet
                        </div>
                    )}

                    {/* Divider */}
                    <div className="my-2 border-t border-slate-100" />

                    {/* Static nav links */}
                    <SidebarLink
                        href="/workspaces"
                        icon={<Briefcase className="h-4 w-4" />}
                        label="All Workspaces"
                        collapsed={collapsed}
                        active={pathname === "/workspaces"}
                    />
                    <SidebarLink
                        href="/notifications"
                        icon={
                            <div className="relative">
                                <Bell className="h-4 w-4" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
                                        {unreadCount > 9 ? "9+" : unreadCount}
                                    </span>
                                )}
                            </div>
                        }
                        label="Notifications"
                        collapsed={collapsed}
                        active={pathname === "/notifications"}
                    />
                    <SidebarLink
                        href="/profile"
                        icon={<User className="h-4 w-4" />}
                        label="Profile"
                        collapsed={collapsed}
                        active={pathname === "/profile"}
                    />
                </nav>

                {/* User footer */}
                <div className={cn("border-t border-slate-100 p-2", collapsed && "px-1")}>
                    <div className="relative">
                        <button
                            onClick={(e) => { e.stopPropagation(); setUserMenuOpen((v) => !v); }}
                            className={cn(
                                "w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-slate-100 transition-colors",
                                collapsed && "justify-center px-0"
                            )}
                        >
                            {user ? (
                                <Avatar src={user.avatar} name={user.name} size="sm" />
                            ) : (
                                <div className="h-8 w-8 rounded-full bg-slate-200 animate-pulse shrink-0" />
                            )}
                            {!collapsed && user && (
                                <div className="text-left min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-slate-800 truncate">{user.name}</p>
                                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                                </div>
                            )}
                        </button>

                        {userMenuOpen && (
                            <div className={cn(
                                "absolute bottom-full mb-1 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50 w-52",
                                collapsed ? "left-full ml-2 bottom-0" : "left-0 right-0"
                            )}>
                                <div className="px-3 py-2 border-b border-slate-100">
                                    <p className="text-xs font-semibold text-slate-800 truncate">{user?.name}</p>
                                    <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                                </div>
                                <Link
                                    href="/profile"
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                    onClick={() => setUserMenuOpen(false)}
                                >
                                    <User className="h-4 w-4" />
                                    Profile
                                </Link>
                                <button
                                    onClick={handleLogout}
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

                {/* Collapse toggle */}
                <button
                    onClick={() => setCollapsed((v) => !v)}
                    className="absolute left-full top-1/2 -translate-y-1/2 ml-[-1px] flex items-center justify-center h-6 w-6 rounded-full bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow z-10 text-slate-400 hover:text-slate-600"
                    style={{ position: "fixed", left: collapsed ? "4rem" : "15rem", marginTop: "0" }}
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
                </button>
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
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
                "flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors",
                active
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                collapsed && "justify-center"
            )}
            title={collapsed ? label : undefined}
        >
            <span className="shrink-0">{icon}</span>
            {!collapsed && <span>{label}</span>}
        </Link>
    );
}