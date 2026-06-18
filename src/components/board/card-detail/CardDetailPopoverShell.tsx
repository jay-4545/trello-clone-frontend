"use client";
import { cn } from "@/utils/cn";

interface Props {
    title: string;
    children: React.ReactNode;
    className?: string;
}

export default function CardDetailPopoverShell({ title, children, className }: Props) {
    return (
        <div className={cn("relative", className)}>
            <p className="text-sm font-semibold text-[#172b4d] text-center mb-3">{title}</p>
            {children}
        </div>
    );
}
