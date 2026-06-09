// src/components/ui/Input.tsx
import { forwardRef } from "react";
import { cn } from "@/utils/cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
    leftElement?: React.ReactNode;
    rightElement?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        { label, error, hint, leftElement, rightElement, className, id, ...props },
        ref
    ) => {
        const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

        return (
            <div className="flex flex-col gap-1.5 w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="text-sm font-medium text-slate-700"
                    >
                        {label}
                        {props.required && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                )}

                <div className="relative flex items-center">
                    {leftElement && (
                        <div className="absolute left-3 flex items-center text-slate-400 pointer-events-none">
                            {leftElement}
                        </div>
                    )}

                    <input
                        ref={ref}
                        id={inputId}
                        className={cn(
                            "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors duration-150",
                            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                            "disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed",
                            error
                                ? "border-red-400 focus:ring-red-500"
                                : "border-slate-300 hover:border-slate-400",
                            leftElement && "pl-10",
                            rightElement && "pr-10",
                            className
                        )}
                        aria-invalid={!!error}
                        aria-describedby={
                            error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
                        }
                        {...props}
                    />

                    {rightElement && (
                        <div className="absolute right-3 flex items-center text-slate-400">
                            {rightElement}
                        </div>
                    )}
                </div>

                {error && (
                    <p
                        id={`${inputId}-error`}
                        className="text-xs text-red-500 flex items-center gap-1"
                        role="alert"
                    >
                        {error}
                    </p>
                )}
                {!error && hint && (
                    <p id={`${inputId}-hint`} className="text-xs text-slate-500">
                        {hint}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";
export default Input;