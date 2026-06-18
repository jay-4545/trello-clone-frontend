"use client";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";

interface Props {
    icon: LucideIcon;
    title: string;
    accentColor?: string;
    action?: React.ReactNode;
    className?: string;
    children: React.ReactNode;
    saving?: boolean;
}

export default function CardDetailSection({
    icon: Icon,
    title,
    accentColor,
    action,
    className,
    children,
    saving,
}: Props) {
    return (
        <section
            className={cn(
                saving && "opacity-70 transition-opacity duration-150",
                className
            )}
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Icon
                        className="h-4 w-4 shrink-0 text-slate-500"
                        style={accentColor ? { color: accentColor } : undefined}
                    />
                    <h3 className="text-sm font-semibold text-[#172b4d]">{title}</h3>
                </div>
                {action}
            </div>
            {children}
        </section>
    );
}
