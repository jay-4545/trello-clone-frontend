"use client";
import {
    Users,
    Briefcase,
    LayoutGrid,
    CreditCard,
    MessageSquare,
    AlertTriangle,
    Activity,
    ArrowRight,
    User,
} from "lucide-react";
import Link from "next/link";
import AdminPage from "@/components/admin/AdminPage";
import StatCard from "@/components/admin/StatCard";
import { useGetSystemStatsQuery } from "@/lib/api/adminApi";
import { useGetProfileQuery } from "@/lib/api/authApi";
import { cn } from "@/utils/cn";

const STATS = [
    { key: "totalUsers", label: "Total users", icon: Users, color: "text-blue-600 bg-blue-50", href: "/admin/users" },
    { key: "activeUsers", label: "Active (30d)", icon: Activity, color: "text-emerald-600 bg-emerald-50", href: "/admin/users" },
    { key: "totalWorkspaces", label: "Workspaces", icon: Briefcase, color: "text-violet-600 bg-violet-50", href: "/admin/workspaces" },
    { key: "totalBoards", label: "Boards", icon: LayoutGrid, color: "text-amber-600 bg-amber-50", href: "/admin/boards" },
    { key: "totalCards", label: "Cards", icon: CreditCard, color: "text-rose-600 bg-rose-50", href: "/admin/cards" },
    { key: "totalComments", label: "Comments", icon: MessageSquare, color: "text-cyan-600 bg-cyan-50", href: "/admin/comments" },
] as const;

const QUICK_LINKS = [
    { href: "/admin/users", label: "Manage users", desc: "Roles, activate / deactivate accounts", icon: Users },
    { href: "/admin/workspaces", label: "Browse workspaces", desc: "All workspaces and owners", icon: Briefcase },
    { href: "/admin/boards", label: "Browse boards", desc: "Visibility and status filters", icon: LayoutGrid },
    { href: "/admin/cards", label: "Browse cards", desc: "All cards across boards", icon: CreditCard },
    { href: "/admin/comments", label: "Review comments", desc: "Read-only comment review", icon: MessageSquare },
    { href: "/admin/error-logs", label: "Error logs", desc: "Debug API, auth, and socket failures", icon: AlertTriangle },
    { href: "/admin/profile", label: "My profile", desc: "Avatar, password, account security", icon: User },
];

export default function AdminDashboardPage() {
    const { data: statsData, isLoading } = useGetSystemStatsQuery();
    const { data: profileData } = useGetProfileQuery();
    const stats = statsData?.data;
    const user = profileData?.data;

    return (
        <AdminPage>
            <div className="space-y-8">
                {user && (
                    <p className="text-sm text-slate-600">
                        Welcome back, <span className="font-semibold text-slate-900">{user.name}</span>
                    </p>
                )}

                <section>
                    <h2 className="text-sm font-semibold text-slate-700 mb-4">Platform metrics</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
                        {STATS.map(({ key, label, icon, color, href }) => (
                            <StatCard
                                key={key}
                                label={label}
                                value={stats?.[key]}
                                icon={icon}
                                color={color}
                                loading={isLoading}
                                href={href}
                            />
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="text-sm font-semibold text-slate-700 mb-4">Quick actions</h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {QUICK_LINKS.map(({ href, label, desc, icon: Icon }) => (
                            <Link
                                key={href}
                                href={href}
                                className="group flex items-center gap-4 bg-white border border-slate-200 rounded-xl p-4 hover:border-violet-200 hover:shadow-md transition-all"
                            >
                                <div className="h-10 w-10 rounded-lg bg-violet-50 flex items-center justify-center shrink-0 group-hover:bg-violet-100 transition-colors">
                                    <Icon className="h-5 w-5 text-violet-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-900">{label}</p>
                                    <p className="text-xs text-slate-500 truncate">{desc}</p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-violet-500 transition-colors shrink-0" />
                            </Link>
                        ))}
                    </div>
                </section>

                <section className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-6 text-white">
                    <h3 className="text-lg font-bold mb-1">System administration</h3>
                    <p className="text-sm text-violet-100 mb-4 max-w-3xl">
                        Use the sidebar to navigate between users, workspaces, boards, cards, and comments.
                        All tables support search, filters, and pagination.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {["Search & filter", "Paginated tables", "Role management"].map((tag) => (
                            <span
                                key={tag}
                                className={cn(
                                    "text-xs font-medium px-2.5 py-1 rounded-full",
                                    "bg-white/15 text-white/90"
                                )}
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </section>
            </div>
        </AdminPage>
    );
}
