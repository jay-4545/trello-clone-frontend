import { Eye } from "lucide-react";
import { cn } from "@/utils/cn";

interface ViewOnlyBannerProps {
    message?: string;
    className?: string;
    variant?: "light" | "dark";
}

export default function ViewOnlyBanner({
    message = "You have view-only access. Contact an admin to request edit permissions.",
    className,
    variant = "light",
}: ViewOnlyBannerProps) {
    return (
        <div
            className={cn(
                "flex items-center gap-2 px-3 py-2 text-xs font-medium shrink-0",
                variant === "dark"
                    ? "bg-amber-500/20 text-amber-100 border-b border-amber-400/20"
                    : "bg-amber-50 text-amber-800 border-b border-amber-200",
                className
            )}
        >
            <Eye className="h-3.5 w-3.5 shrink-0" />
            <span>{message}</span>
        </div>
    );
}
