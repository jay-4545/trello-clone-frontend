"use client";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";

interface Props {
    icon: LucideIcon;
    message: string;
    className?: string;
}

export default function CardDetailEmpty({ icon: Icon, message, className }: Props) {
    return (
        <div
            className={cn(
                "rounded-lg border border-dashed border-slate-300 bg-slate-50/60 px-4 py-5",
                "flex flex-col items-center gap-2 text-center",
                className
            )}
        >
            <Icon className="h-5 w-5 text-slate-400" />
            <p className="text-xs text-slate-500">{message}</p>
        </div>
    );
}
