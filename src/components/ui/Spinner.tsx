// src/components/ui/Spinner.tsx
import { cn } from "@/utils/cn";
import { Loader2 } from "lucide-react";

interface SpinnerProps {
    size?: "sm" | "md" | "lg";
    className?: string;
    label?: string;
}

const sizeMap = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-8 w-8" };

export default function Spinner({ size = "md", className, label = "Loading…" }: SpinnerProps) {
    return (
        <span role="status" aria-label={label} className="inline-flex items-center justify-center">
            <Loader2 className={cn("animate-spin text-blue-600", sizeMap[size], className)} />
        </span>
    );
}