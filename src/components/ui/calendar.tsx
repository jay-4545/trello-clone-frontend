"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker";
import { cn } from "@/utils/cn";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function CalendarDayButton({
    className,
    day,
    modifiers,
    ...props
}: React.ComponentProps<typeof DayButton>) {
    const defaultClassNames = getDefaultClassNames();
    const ref = React.useRef<HTMLButtonElement>(null);

    React.useEffect(() => {
        if (modifiers.focused) ref.current?.focus();
    }, [modifiers.focused]);

    const isSelected =
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle;

    return (
        <button
            ref={ref}
            type="button"
            className={cn(
                defaultClassNames.day_button,
                "inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-normal transition-colors",
                "hover:bg-slate-100 cursor-pointer",
                isSelected && "bg-blue-600 text-white hover:bg-blue-600 hover:text-white",
                modifiers.today && !isSelected && "bg-slate-100 font-semibold text-slate-900",
                modifiers.outside && "text-slate-400",
                modifiers.disabled && "pointer-events-none opacity-30",
                className
            )}
            {...props}
        />
    );
}

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
    const defaultClassNames = getDefaultClassNames();

    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            navLayout="around"
            className={cn("p-3", className)}
            classNames={{
                root: cn("w-fit", defaultClassNames.root),
                months: cn("flex flex-col gap-4", defaultClassNames.months),
                month: cn("space-y-2", defaultClassNames.month),
                month_caption: cn("relative mb-2", defaultClassNames.month_caption),
                caption_label: cn(
                    "text-sm font-semibold text-slate-800",
                    defaultClassNames.caption_label
                ),
                button_previous: cn(
                    defaultClassNames.button_previous,
                    "inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white",
                    "hover:bg-slate-50 text-slate-600 cursor-pointer"
                ),
                button_next: cn(
                    defaultClassNames.button_next,
                    "inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white",
                    "hover:bg-slate-50 text-slate-600 cursor-pointer"
                ),
                month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
                weekdays: defaultClassNames.weekdays,
                weekday: cn(
                    "h-8 w-9 p-0 text-center text-[0.75rem] font-medium text-slate-500",
                    defaultClassNames.weekday
                ),
                weeks: defaultClassNames.weeks,
                week: defaultClassNames.week,
                day: cn("h-8 w-9 p-0 text-center align-middle", defaultClassNames.day),
                day_button: defaultClassNames.day_button,
                today: defaultClassNames.today,
                outside: defaultClassNames.outside,
                selected: defaultClassNames.selected,
                disabled: defaultClassNames.disabled,
                hidden: defaultClassNames.hidden,
                chevron: defaultClassNames.chevron,
                ...classNames,
            }}
            components={{
                Chevron: ({ orientation, className: chevronClassName }) =>
                    orientation === "left" ? (
                        <ChevronLeft className={cn("h-4 w-4", chevronClassName)} />
                    ) : (
                        <ChevronRight className={cn("h-4 w-4", chevronClassName)} />
                    ),
                DayButton: CalendarDayButton,
            }}
            {...props}
        />
    );
}

export { Calendar };
