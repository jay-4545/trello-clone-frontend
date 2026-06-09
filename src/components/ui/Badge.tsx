// src/components/ui/Badge.tsx
import { cn } from "@/utils/cn";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "purple";

interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    size?: "sm" | "md";
    className?: string;
    dot?: boolean;
}

const variantMap: Record<BadgeVariant, string> = {
    default: "bg-slate-100 text-slate-700",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-red-100 text-red-700",
    info: "bg-blue-100 text-blue-700",
    purple: "bg-violet-100 text-violet-700",
};

const dotColorMap: Record<BadgeVariant, string> = {
    default: "bg-slate-500",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-red-500",
    info: "bg-blue-500",
    purple: "bg-violet-500",
};

export default function Badge({
    children,
    variant = "default",
    size = "sm",
    className,
    dot,
}: BadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 font-medium rounded-full",
                size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1",
                variantMap[variant],
                className
            )}
        >
            {dot && (
                <span
                    className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColorMap[variant])}
                />
            )}
            {children}
        </span>
    );
}