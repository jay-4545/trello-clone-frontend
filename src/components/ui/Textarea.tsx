// src/components/ui/Textarea.tsx
import { forwardRef } from "react";
import { cn } from "@/utils/cn";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ label, error, hint, className, id, ...props }, ref) => {
        const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

        return (
            <div className="flex flex-col gap-1.5 w-full">
                {label && (
                    <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
                        {label}
                        {props.required && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                )}
                <textarea
                    ref={ref}
                    id={inputId}
                    className={cn(
                        "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors duration-150 resize-none",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                        "disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed",
                        error ? "border-red-400 focus:ring-red-500" : "border-slate-300 hover:border-slate-400",
                        className
                    )}
                    aria-invalid={!!error}
                    {...props}
                />
                {error && <p className="text-xs text-red-500" role="alert">{error}</p>}
                {!error && hint && <p className="text-xs text-slate-500">{hint}</p>}
            </div>
        );
    }
);

Textarea.displayName = "Textarea";
export default Textarea;