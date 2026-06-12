"use client";
import { useState } from "react";
import { Search, X, SlidersHorizontal, ChevronDown } from "lucide-react";
import { cn } from "@/utils/cn";
import Input from "./Input";
import Select from "./Select";
import type { SelectOption } from "./Select";
import Button from "./Button";

export interface TableFilterField {
    id: string;
    type: "search" | "select";
    label?: string;
    placeholder?: string;
    options?: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    className?: string;
    clearable?: boolean;
}

interface TableFiltersProps {
    fields: TableFilterField[];
    onReset?: () => void;
    hasActiveFilters?: boolean;
    className?: string;
    title?: string;
}

function countActiveFilters(fields: TableFilterField[]) {
    return fields.filter((f) => f.value.trim() !== "").length;
}

export default function TableFilters({
    fields,
    onReset,
    hasActiveFilters,
    className,
    title = "Filters",
}: TableFiltersProps) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const searchField = fields.find((f) => f.type === "search");
    const selectFields = fields.filter((f) => f.type === "select");
    const activeCount = countActiveFilters(fields);
    const showActive = hasActiveFilters ?? activeCount > 0;

    const filterContent = (
        <div className="flex flex-col lg:flex-row gap-3">
            {searchField && (
                <div className="flex-1 min-w-0">
                    <Input
                        placeholder={searchField.placeholder ?? "Search…"}
                        value={searchField.value}
                        onChange={(e) => searchField.onChange(e.target.value)}
                        leftElement={<Search className="h-4 w-4" />}
                    />
                </div>
            )}

            {selectFields.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectFields.map((field) => (
                        <Select
                            key={field.id}
                            label={field.label}
                            options={field.options ?? []}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder={field.placeholder ?? "All"}
                            clearable={field.clearable}
                            size="sm"
                            className={cn("min-w-[140px]", field.className)}
                        />
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className={cn("bg-white border border-slate-200 rounded-xl shadow-sm", className)}>
            {/* Mobile collapsible header */}
            <div className="md:hidden p-3">
                <button
                    type="button"
                    onClick={() => setMobileOpen((v) => !v)}
                    className="w-full flex items-center justify-between gap-2 text-sm font-semibold text-slate-700"
                >
                    <span className="flex items-center gap-2">
                        <SlidersHorizontal className="h-4 w-4 text-slate-400" />
                        {title}
                        {activeCount > 0 && (
                            <span className="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-violet-600 text-white text-[10px] font-bold">
                                {activeCount}
                            </span>
                        )}
                    </span>
                    <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", mobileOpen && "rotate-180")} />
                </button>

                {mobileOpen && (
                    <div className="mt-3 space-y-3">
                        {filterContent}
                        {showActive && onReset && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onReset}
                                leftIcon={<X className="h-3.5 w-3.5" />}
                                className="text-slate-500"
                            >
                                Clear all
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Desktop always expanded */}
            <div className="hidden md:block p-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <SlidersHorizontal className="h-4 w-4 text-slate-400" />
                        {title}
                    </div>
                    {showActive && onReset && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onReset}
                            leftIcon={<X className="h-3.5 w-3.5" />}
                            className="text-slate-500"
                        >
                            Clear all
                        </Button>
                    )}
                </div>
                {filterContent}
            </div>
        </div>
    );
}
