// src/components/ui/Skeleton.tsx
import { cn } from "@/utils/cn";

interface SkeletonProps {
    className?: string;
    count?: number;
}

export default function Skeleton({ className, count = 1 }: SkeletonProps) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className={cn(
                        "animate-pulse rounded-md bg-slate-200",
                        className
                    )}
                    aria-hidden="true"
                />
            ))}
        </>
    );
}

// Pre-built card skeleton for kanban
export function CardSkeleton() {
    return (
        <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-200 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex items-center justify-between pt-1">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-6 w-6 rounded-full" />
            </div>
        </div>
    );
}

// Pre-built workspace card skeleton
export function WorkspaceCardSkeleton() {
    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden min-h-[180px]">
            <Skeleton className="h-1.5 w-full rounded-none" />
            <div className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-11 w-11 rounded-xl" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
            </div>
            <div className="border-t border-slate-100 px-5 py-3 flex justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-14 rounded-full" />
            </div>
        </div>
    );
}