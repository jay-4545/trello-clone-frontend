"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Briefcase,
    LayoutGrid,
    CreditCard,
    MessageSquare,
    AlertTriangle,
    Shield,
    ArrowLeft,
    Menu,
    X,
    LogOut,
    User,
    Bell,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/utils/cn";
import RoleBadge from "@/components/roles/RoleBadge";
import Avatar from "@/components/ui/Avatar";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useGetProfileQuery, useLogoutMutation } from "@/lib/api/authApi";
import { useGetUnreadCountQuery } from "@/lib/api/notificationApi";
import { useAppDispatch } from "@/store";
import { performLogout } from "@/store/authSession";
import { useAuthToken } from "@/hooks/useAuthToken";
import { getAdminPageMeta } from "@/components/admin/adminPageMeta";

const NAV_MAIN = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/workspaces", label: "Workspaces", icon: Briefcase },
    { href: "/admin/boards", label: "Boards", icon: LayoutGrid },
    { href: "/admin/cards", label: "Cards", icon: CreditCard },
    { href: "/admin/comments", label: "Comments", icon: MessageSquare },
    { href: "/admin/error-logs", label: "Error logs", icon: AlertTriangle },
];

const NAV_ACCOUNT = [
    { href: "/admin/profile", label: "My profile", icon: User, exact: true },
    { href: "/admin/notifications", label: "Notifications", icon: Bell, badge: true },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const hasToken = useAuthToken();
    const pageMeta = getAdminPageMeta(pathname);

    const [mobileOpen, setMobileOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [confirmSignOut, setConfirmSignOut] = useState(false);

    const { data: profileData } = useGetProfileQuery(undefined, { skip: !hasToken });
    const { data: unreadData } = useGetUnreadCountQuery(undefined, { skip: !hasToken });
    const [logoutMutation, { isLoading: loggingOut }] = useLogoutMutation();

    const user = profileData?.data;
    const unreadCount = unreadData?.data?.count ?? 0;

    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    useEffect(() => {
        const handler = () => setUserMenuOpen(false);
        if (userMenuOpen) document.addEventListener("click", handler);
        return () => document.removeEventListener("click", handler);
    }, [userMenuOpen]);

    const handleLogout = async () => {
        await performLogout(dispatch, () => logoutMutation().unwrap());
        toast.success("Signed out successfully");
        router.replace("/login");
    };

    const sidebarContent = (
        <>
            <div className="px-4 py-4 border-b border-slate-800/70 shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md">
                        <Shield className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">Admin Panel</p>
                        {user?.role && (
                            <RoleBadge
                                role={user.role}
                                scope="system"
                                className="mt-0.5 !text-[10px]"
                            />
                        )}
                    </div>
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="lg:hidden ml-auto flex items-center justify-center h-8 w-8 rounded-lg hover:bg-white/10 text-slate-300"
                        aria-label="Close menu"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto p-2 space-y-1">
                <p className="px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Management
                </p>
                {NAV_MAIN.map(({ href, label, icon: Icon, exact }) => {
                    const active = exact ? pathname === href : pathname.startsWith(href);
                    return (
                        <NavLink key={href} href={href} label={label} icon={Icon} active={active} />
                    );
                })}

                <div className="my-2 border-t border-slate-800/70" />
                <p className="px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Account
                </p>
                {NAV_ACCOUNT.map(({ href, label, icon: Icon, exact, badge }) => {
                    const active = exact ? pathname === href : pathname.startsWith(href);
                    return (
                        <NavLink
                            key={href}
                            href={href}
                            label={label}
                            icon={Icon}
                            active={active}
                            badge={badge ? unreadCount : undefined}
                        />
                    );
                })}

                <div className="my-2 border-t border-slate-800/70" />
                <Link
                    href="/workspaces"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                >
                    <ArrowLeft className="h-4 w-4 shrink-0" />
                    Back to app
                </Link>
            </nav>

            <div className="border-t border-slate-800/70 p-2 shrink-0">
                <div className="relative">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setUserMenuOpen((v) => !v);
                        }}
                        className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                        {user ? (
                            <Avatar src={user.avatar} name={user.name} size="sm" />
                        ) : (
                            <div className="h-8 w-8 rounded-full bg-slate-700 animate-pulse shrink-0" />
                        )}
                        {user && (
                            <div className="text-left min-w-0 flex-1">
                                <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                                <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                            </div>
                        )}
                    </button>

                    {userMenuOpen && (
                        <div className="absolute bottom-full mb-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in-0 slide-in-from-bottom-2 duration-150">
                            <Link
                                href="/admin/profile"
                                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                onClick={() => setUserMenuOpen(false)}
                            >
                                <User className="h-4 w-4" />
                                My profile
                            </Link>
                            <button
                                onClick={() => {
                                    setUserMenuOpen(false);
                                    setConfirmSignOut(true);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                                <LogOut className="h-4 w-4" />
                                Sign out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );

    return (
        <div className="flex h-screen bg-slate-100 overflow-hidden">
            {/* Mobile top bar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-[#0F172A] border-b border-slate-800 flex items-center justify-between px-4 gap-3">
                <button
                    onClick={() => setMobileOpen(true)}
                    className="flex items-center justify-center h-9 w-9 rounded-lg hover:bg-white/10 text-slate-200 shrink-0"
                    aria-label="Open menu"
                >
                    <Menu className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-2 min-w-0 flex-1 justify-center">
                    <Shield className="h-4 w-4 text-violet-400 shrink-0" />
                    <span className="text-sm font-bold text-white truncate">{pageMeta.title}</span>
                </div>
                <Link href="/admin/profile" className="flex items-center justify-center h-9 w-9 rounded-lg hover:bg-white/10 shrink-0">
                    {user ? <Avatar src={user.avatar} name={user.name} size="sm" /> : <User className="h-5 w-5 text-slate-200" />}
                </Link>
            </div>

            {mobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                    onClick={() => setMobileOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "flex flex-col bg-gradient-to-b from-[#0F172A] via-[#111A2E] to-[#0F172A] border-r border-slate-800 z-50 shrink-0",
                    "fixed inset-y-0 left-0 w-60 lg:relative lg:translate-x-0 transition-transform duration-300",
                    mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                {sidebarContent}
            </aside>

            {/* Main */}
            <main className="flex-1 overflow-y-auto min-h-0 pt-14 lg:pt-0">
                <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-5 hidden lg:block">
                    <h1 className="text-xl font-bold text-slate-900">{pageMeta.title}</h1>
                    {pageMeta.description && (
                        <p className="text-sm text-slate-500 mt-0.5">{pageMeta.description}</p>
                    )}
                </div>
                <div className="p-4 sm:p-6 bg-slate-50 min-h-full">{children}</div>
            </main>

            <ConfirmDialog
                open={confirmSignOut}
                onClose={() => setConfirmSignOut(false)}
                onConfirm={async () => {
                    await handleLogout();
                    setConfirmSignOut(false);
                }}
                loading={loggingOut}
                title="Sign out?"
                description="You'll need to sign in again to access the admin panel."
                confirmLabel="Sign out"
                cancelLabel="Stay signed in"
            />
        </div>
    );
}

function NavLink({
    href,
    label,
    icon: Icon,
    active,
    badge,
}: {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    active: boolean;
    badge?: number;
}) {
    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative",
                active
                    ? "bg-violet-500/20 text-white"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
            )}
        >
            {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-violet-400 rounded-r" />
            )}
            <div className="relative shrink-0">
                <Icon className={cn("h-4 w-4", active && "text-violet-300")} />
                {badge != null && badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
                        {badge > 9 ? "9+" : badge}
                    </span>
                )}
            </div>
            {label}
        </Link>
    );
}
