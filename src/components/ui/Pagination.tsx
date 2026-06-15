"use client";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/utils/cn";
import type { PaginationMeta } from "@/types/api.types";
import Select from "./Select";

const PAGE_SIZE_OPTIONS = [
    { value: "10", label: "10 / page" },
    { value: "15", label: "15 / page" },
    { value: "25", label: "25 / page" },
    { value: "50", label: "50 / page" },
];

interface PaginationProps {
    meta?: PaginationMeta;
    page: number;
    limit: number;
    onPageChange: (page: number) => void;
    onLimitChange?: (limit: number) => void;
    className?: string;
    showPageSize?: boolean;
    compact?: boolean;
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (current > 3) pages.push("...");
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        pages.push(i);
    }
    if (current < total - 2) pages.push("...");
    pages.push(total);
    return pages;
}

export default function Pagination({
    meta,
    page,
    limit,
    onPageChange,
    onLimitChange,
    className,
    showPageSize = true,
    compact = false,
}: PaginationProps) {
    if (!meta || meta.total === 0) return null;

    const { total, totalPages } = meta;
    const from = (page - 1) * limit + 1;
    const to = Math.min(page * limit, total);
    const pages = getPageNumbers(page, totalPages);

    if (compact) {
        return (
            <div
                className={cn(
                    "flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 bg-slate-50/50",
                    className
                )}
            >
                <p className="text-xs text-slate-500 hidden sm:block">
                    <span className="font-medium text-slate-700">{from}–{to}</span> of{" "}
                    <span className="font-medium text-slate-700">{total.toLocaleString()}</span>
                </p>

                <div className="flex items-center gap-2 flex-1 sm:flex-none justify-center sm:justify-end">
                    <PaginationBtn
                        onClick={() => onPageChange(page - 1)}
                        disabled={page <= 1}
                        aria-label="Previous page"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </PaginationBtn>

                    <span className="text-xs font-medium text-slate-700 min-w-[80px] text-center">
                        Page {page} of {totalPages}
                    </span>

                    <PaginationBtn
                        onClick={() => onPageChange(page + 1)}
                        disabled={page >= totalPages}
                        aria-label="Next page"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </PaginationBtn>
                </div>

                {showPageSize && onLimitChange && (
                    <div className="hidden sm:block sm:min-w-[120px]">
                        <Select
                            options={PAGE_SIZE_OPTIONS}
                            value={String(limit)}
                            onChange={(v) => {
                                onLimitChange(Number(v));
                                onPageChange(1);
                            }}
                            size="sm"
                        />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            className={cn(
                "flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 bg-slate-50/50",
                className
            )}
        >
            <p className="text-xs text-slate-500 order-2 sm:order-1">
                Showing <span className="font-medium text-slate-700">{from}–{to}</span> of{" "}
                <span className="font-medium text-slate-700">{total.toLocaleString()}</span>
            </p>

            <div className="flex items-center gap-1 order-1 sm:order-2">
                <PaginationBtn
                    onClick={() => onPageChange(1)}
                    disabled={page <= 1}
                    aria-label="First page"
                >
                    <ChevronsLeft className="h-4 w-4" />
                </PaginationBtn>
                <PaginationBtn
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1}
                    aria-label="Previous page"
                >
                    <ChevronLeft className="h-4 w-4" />
                </PaginationBtn>

                <div className="hidden sm:flex items-center gap-0.5 mx-1">
                    {pages.map((p, i) =>
                        p === "..." ? (
                            <span key={`ellipsis-${i}`} className="px-2 text-slate-400 text-sm">…</span>
                        ) : (
                            <button
                                key={p}
                                onClick={() => onPageChange(p)}
                                className={cn(
                                    "min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                                    p === page
                                        ? "bg-violet-600 text-white shadow-sm"
                                        : "text-slate-600 hover:bg-white hover:shadow-sm"
                                )}
                            >
                                {p}
                            </button>
                        )
                    )}
                </div>

                <span className="sm:hidden text-xs text-slate-600 px-2">
                    {page} / {totalPages}
                </span>

                <PaginationBtn
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages}
                    aria-label="Next page"
                >
                    <ChevronRight className="h-4 w-4" />
                </PaginationBtn>
                <PaginationBtn
                    onClick={() => onPageChange(totalPages)}
                    disabled={page >= totalPages}
                    aria-label="Last page"
                >
                    <ChevronsRight className="h-4 w-4" />
                </PaginationBtn>
            </div>

            {showPageSize && onLimitChange && (
                <div className="order-3 w-full sm:w-auto sm:min-w-[120px]">
                    <Select
                        options={PAGE_SIZE_OPTIONS}
                        value={String(limit)}
                        onChange={(v) => {
                            onLimitChange(Number(v));
                            onPageChange(1);
                        }}
                        size="sm"
                    />
                </div>
            )}
        </div>
    );
}

function PaginationBtn({
    children,
    disabled,
    onClick,
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={cn(
                "flex items-center justify-center h-8 w-8 rounded-lg transition-colors",
                disabled
                    ? "text-slate-300 cursor-not-allowed"
                    : "text-slate-600 hover:bg-white hover:shadow-sm cursor-pointer"
            )}
            {...props}
        >
            {children}
        </button>
    );
}
