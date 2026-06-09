// src/components/ui/ErrorMessage.tsx
import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/utils/cn";
import Button from "./Button";

interface ErrorMessageProps {
    message?: string;
    onRetry?: () => void;
    className?: string;
    inline?: boolean;
}

export default function ErrorMessage({
    message = "Something went wrong. Please try again.",
    onRetry,
    className,
    inline = false,
}: ErrorMessageProps) {
    if (inline) {
        return (
            <p
                role="alert"
                className={cn(
                    "flex items-center gap-1.5 text-sm text-red-600",
                    className
                )}
            >
                <AlertCircle className="h-4 w-4 shrink-0" />
                {message}
            </p>
        );
    }

    return (
        <div
            role="alert"
            className={cn(
                "flex flex-col items-center justify-center gap-3 py-10 px-4 text-center",
                className
            )}
        >
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-50">
                <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800">Error</p>
                <p className="text-sm text-slate-500 max-w-xs">{message}</p>
            </div>
            {onRetry && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onRetry}
                    leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                >
                    Try again
                </Button>
            )}
        </div>
    );
}