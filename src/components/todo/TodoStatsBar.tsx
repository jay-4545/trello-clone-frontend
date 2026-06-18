"use client";
import { useGetTodoStatsQuery } from "@/lib/api/todoApi";
import { cn } from "@/utils/cn";

interface Props {
    activeStatus?: string | null;
    onStatusClick?: (status: string | null) => void;
}

const STAT_ITEMS = [
    { key: null, label: "All", field: "total" as const },
    { key: "pending", label: "Pending", field: "pending" as const },
    { key: "in_progress", label: "In progress", field: "in_progress" as const },
    { key: "completed", label: "Completed", field: "completed" as const },
];

export default function TodoStatsBar({ activeStatus, onStatusClick }: Props) {
    const { data, isLoading } = useGetTodoStatsQuery();
    const stats = data?.data;

    if (isLoading) {
        return (
            <div className="flex flex-wrap gap-2">
                {STAT_ITEMS.map((item) => (
                    <div key={item.label} className="h-8 w-24 rounded-lg bg-slate-100 animate-pulse" />
                ))}
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="flex flex-wrap gap-2">
            {STAT_ITEMS.map((item) => {
                const count = stats[item.field];
                const isActive = activeStatus === item.key;
                return (
                    <button
                        key={item.label}
                        type="button"
                        onClick={() => onStatusClick?.(item.key)}
                        className={cn(
                            "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer",
                            isActive
                                ? "border-blue-300 bg-blue-50 text-blue-700"
                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                        )}
                    >
                        <span>{item.label}</span>
                        <span
                            className={cn(
                                "rounded-full px-1.5 py-0.5 text-xs font-semibold",
                                isActive ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                            )}
                        >
                            {count}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
