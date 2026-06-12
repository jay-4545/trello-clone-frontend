"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui";
import { useGetProfileQuery } from "@/lib/api/authApi";
import { isSystemAdmin } from "@/hooks/usePermissions";
import { useAuthToken } from "@/hooks/useAuthToken";

function GuardChrome({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen bg-slate-100 overflow-hidden">
            <div className="hidden lg:flex flex-col w-60 bg-gradient-to-b from-[#0F172A] via-[#111A2E] to-[#0F172A] border-r border-slate-800 shrink-0">
                <div className="px-4 py-4 border-b border-slate-800/70">
                    <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                            <Shield className="h-4 w-4 text-white" />
                        </div>
                        <p className="text-sm font-bold text-white">Admin Panel</p>
                    </div>
                </div>
                <div className="p-2">
                    <Link
                        href="/workspaces"
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4 shrink-0" />
                        Back to app
                    </Link>
                </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
                <div className="lg:hidden h-14 bg-[#0F172A] border-b border-slate-800 flex items-center px-4 gap-3 shrink-0">
                    <Link
                        href="/workspaces"
                        className="flex items-center gap-2 text-sm text-slate-300 hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to app
                    </Link>
                </div>
                <div className="flex-1 overflow-y-auto bg-slate-50">{children}</div>
            </div>
        </div>
    );
}

export default function AdminGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const hasToken = useAuthToken();
    const { data: profileData, isLoading } = useGetProfileQuery(undefined, { skip: !hasToken });
    const user = profileData?.data;

    if (!hasToken) {
        return (
            <GuardChrome>
                <div className="flex items-center justify-center p-6 min-h-[50vh]">
                    <p className="text-sm text-slate-500">Redirecting…</p>
                </div>
            </GuardChrome>
        );
    }

    if (isLoading) {
        return (
            <GuardChrome>
                <div className="p-6 space-y-4 max-w-lg mx-auto">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-64 rounded-xl" />
                </div>
            </GuardChrome>
        );
    }

    if (!isSystemAdmin(user?.role)) {
        return (
            <GuardChrome>
                <div className="flex items-center justify-center p-6 min-h-[50vh]">
                    <div className="text-center max-w-md">
                        <div className="h-14 w-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
                            <Shield className="h-7 w-7 text-red-600" />
                        </div>
                        <h1 className="text-xl font-bold text-slate-900 mb-2">Access denied</h1>
                        <p className="text-sm text-slate-500 mb-6">
                            This area is restricted to system administrators.
                        </p>
                        <Button onClick={() => router.push("/workspaces")}>Back to workspaces</Button>
                    </div>
                </div>
            </GuardChrome>
        );
    }

    return <>{children}</>;
}
