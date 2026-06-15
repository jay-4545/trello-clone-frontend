import { cn } from "@/utils/cn";

const Label = ({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
    <label
        className={cn(
            "text-xs font-semibold text-slate-600 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            className
        )}
        {...props}
    />
);

export { Label };
