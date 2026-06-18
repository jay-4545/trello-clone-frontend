// src/components/ui/Avatar.tsx
import { cn } from "@/utils/cn";

interface AvatarProps {
    src?: string | null;
    name: string;
    size?: "xs" | "sm" | "md" | "lg";
    className?: string;
    title?: string;
}

const sizeMap = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
};

function getInitials(name: string) {
    return name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase();
}

// Deterministic colour from name
const BG_COLORS = [
    "bg-blue-500", "bg-violet-500", "bg-pink-500", "bg-amber-500",
    "bg-emerald-500", "bg-cyan-500", "bg-rose-500", "bg-indigo-500",
];
function getColor(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return BG_COLORS[Math.abs(hash) % BG_COLORS.length];
}

export default function Avatar({ src, name, size = "md", className, title }: AvatarProps) {
    const tooltip = title ?? name;
    if (src) {
        return (
            <img
                src={src}
                alt={name}
                title={tooltip}
                className={cn("rounded-full object-cover shrink-0", sizeMap[size], className)}
            />
        );
    }
    return (
        <div
            title={tooltip}
            className={cn(
                "rounded-full flex items-center justify-center text-white font-semibold shrink-0",
                sizeMap[size],
                getColor(name),
                className
            )}
            aria-label={name}
        >
            {getInitials(name)}
        </div>
    );
}