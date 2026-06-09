// src/components/ui/Button.tsx
import { forwardRef } from "react";
import { cn } from "@/utils/cn";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
    primary:
        "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-300 shadow-sm",
    secondary:
        "bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300 disabled:bg-slate-50 disabled:text-slate-400",
    ghost:
        "bg-transparent text-slate-700 hover:bg-slate-100 active:bg-slate-200 disabled:text-slate-400",
    danger:
        "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:bg-red-300 shadow-sm",
    outline:
        "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 disabled:text-slate-400",
};

const sizeClasses: Record<ButtonSize, string> = {
    sm: "h-8 px-3 text-xs rounded-md gap-1.5",
    md: "h-10 px-4 text-sm rounded-lg gap-2",
    lg: "h-12 px-6 text-base rounded-lg gap-2",
    icon: "h-9 w-9 rounded-lg p-0 shrink-0",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = "primary",
            size = "md",
            loading = false,
            leftIcon,
            rightIcon,
            fullWidth = false,
            className,
            children,
            disabled,
            ...props
        },
        ref
    ) => {
        const isDisabled = disabled || loading;

        return (
            <button
                ref={ref}
                disabled={isDisabled}
                className={cn(
                    "inline-flex items-center justify-center font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed select-none",
                    variantClasses[variant],
                    sizeClasses[size],
                    fullWidth && "w-full",
                    className
                )}
                {...props}
            >
                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                ) : (
                    leftIcon && <span className="shrink-0">{leftIcon}</span>
                )}
                {children && <span>{children}</span>}
                {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
            </button>
        );
    }
);

Button.displayName = "Button";
export default Button;