import Link from "next/link";
import { cn } from "@/utils/cn";
import { Skeleton } from "@/components/ui";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
    label: string;
    value?: number;
    icon: LucideIcon;
    color: string;
    loading?: boolean;
    href?: string;
}

export default function StatCard({ label, value, icon: Icon, color, loading, href }: StatCardProps) {
    const content = (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow h-full">
            <div className="flex items-center gap-3">
                <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center shrink-0", color)}>
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    {loading ? (
                        <Skeleton className="h-8 w-16 mb-1" />
                    ) : (
                        <p className="text-2xl font-bold text-slate-900 tabular-nums">
                            {value?.toLocaleString() ?? "—"}
                        </p>
                    )}
                    <p className="text-xs text-slate-500 font-medium">{label}</p>
                </div>
            </div>
        </div>
    );

    if (href) {
        return <Link href={href} className="block">{content}</Link>;
    }
    return content;
}
