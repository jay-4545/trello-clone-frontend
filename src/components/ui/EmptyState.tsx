// src/components/ui/EmptyState.tsx
import { cn } from "@/utils/cn";
import Button from "./Button";

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
}

export default function EmptyState({
    icon,
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center gap-3 py-16 px-4 text-center",
                className
            )}
        >
            {icon && (
                <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-slate-100 text-slate-400">
                    {icon}
                </div>
            )}
            <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800">{title}</p>
                {description && (
                    <p className="text-sm text-slate-500 max-w-xs">{description}</p>
                )}
            </div>
            {action && (
                <Button size="sm" onClick={action.onClick} className="mt-1">
                    {action.label}
                </Button>
            )}
        </div>
    );
}