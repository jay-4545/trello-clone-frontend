"use client";
import { Skeleton } from "@/components/ui";
import { cn } from "@/utils/cn";

interface Props {
    backgroundColor?: string;
    className?: string;
}

export default function BoardPageSkeleton({ backgroundColor = "#0079BF", className }: Props) {
    return (
        <div
            className={cn("flex flex-col min-h-dvh h-dvh overflow-hidden", className)}
            style={{ backgroundColor }}
            aria-busy="true"
            aria-label="Loading board"
        >
            <div className="shrink-0 h-12 bg-black/30 backdrop-blur-md border-b border-white/10 flex items-center px-2 sm:px-4 gap-3">
                <Skeleton className="h-7 w-7 rounded bg-white/20 shrink-0" />
                <Skeleton className="h-4 w-36 sm:w-48 bg-white/25 rounded" />
                <div className="hidden sm:flex items-center gap-2 ml-2">
                    <Skeleton className="h-7 w-7 rounded bg-white/15" />
                    <Skeleton className="h-7 w-7 rounded bg-white/15" />
                </div>
                <div className="flex-1" />
                <div className="hidden md:flex items-center gap-2">
                    <Skeleton className="h-8 w-48 rounded-lg bg-white/15" />
                    <Skeleton className="h-8 w-8 rounded-lg bg-white/15" />
                    <Skeleton className="h-8 w-8 rounded-lg bg-white/15" />
                </div>
            </div>

            <div className="flex-1 flex gap-3 sm:gap-4 p-3 sm:p-4 overflow-x-auto min-h-0">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="flex flex-col w-[272px] shrink-0 rounded-xl bg-white/15 backdrop-blur-sm p-2.5 gap-2.5"
                    >
                        <Skeleton className="h-4 w-24 bg-white/25 rounded mx-1" />
                        <Skeleton className="h-[72px] w-full bg-white/20 rounded-lg" />
                        <Skeleton className="h-[56px] w-full bg-white/20 rounded-lg" />
                        {i <= 2 && <Skeleton className="h-[64px] w-full bg-white/20 rounded-lg" />}
                        <Skeleton className="h-8 w-full bg-white/10 rounded-lg mt-1" />
                    </div>
                ))}
                <Skeleton className="h-10 w-[272px] shrink-0 rounded-xl bg-white/10 self-start" />
            </div>
        </div>
    );
}
