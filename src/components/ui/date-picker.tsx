"use client";

import { format } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { cn } from "@/utils/cn";
import Button from "@/components/ui/Button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DatePickerProps {
    value?: string | null;
    onChange: (value: string | null) => void;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
}

function toDate(value?: string | null): Date | undefined {
    if (!value) return undefined;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? undefined : d;
}

function toIsoDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

export default function DatePicker({
    value,
    onChange,
    disabled = false,
    placeholder = "Pick a date",
    className,
}: DatePickerProps) {
    const selected = toDate(value);

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <Popover modal={false}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={disabled}
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !selected && "text-slate-500"
                        )}
                        leftIcon={<CalendarIcon className="h-4 w-4" />}
                    >
                        {selected ? format(selected, "MMM d, yyyy") : placeholder}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={selected}
                        onSelect={(date) => onChange(date ? toIsoDate(date) : null)}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
            {selected && !disabled && (
                <button
                    type="button"
                    onClick={() => onChange(null)}
                    className="flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 cursor-pointer shrink-0"
                    aria-label="Clear date"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}
