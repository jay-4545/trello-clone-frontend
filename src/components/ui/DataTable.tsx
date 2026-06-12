"use client";
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";
import EmptyState from "./EmptyState";
import Pagination from "./Pagination";
import type { PaginationMeta } from "@/types/api.types";

export interface DataTableColumn<T> {
    id: string;
    header: string;
    cell: (row: T) => React.ReactNode;
    sortable?: boolean;
    className?: string;
    headerClassName?: string;
    hideOnMobile?: boolean;
    primaryOnMobile?: boolean;
}

interface DataTableProps<T> {
    columns: DataTableColumn<T>[];
    data: T[];
    rowKey: (row: T) => string | number;
    loading?: boolean;
    emptyTitle?: string;
    emptyDescription?: string;
    meta?: PaginationMeta;
    page?: number;
    limit?: number;
    onPageChange?: (page: number) => void;
    onLimitChange?: (limit: number) => void;
    sortBy?: string;
    sortDir?: "asc" | "desc";
    onSort?: (columnId: string) => void;
    className?: string;
    stickyHeader?: boolean;
    mobileVariant?: "scroll" | "cards";
    compactPagination?: boolean;
    onRowClick?: (row: T) => void;
}

function getMobileColumns<T>(columns: DataTableColumn<T>[]) {
    const visible = columns.filter((col) => !col.hideOnMobile || col.primaryOnMobile);
    return visible.length > 0 ? visible : columns.filter((col) => col.id !== "actions");
}

export default function DataTable<T>({
    columns,
    data,
    rowKey,
    loading,
    emptyTitle = "No results found",
    emptyDescription = "Try adjusting your filters or search query.",
    meta,
    page = 1,
    limit = 15,
    onPageChange,
    onLimitChange,
    sortBy,
    sortDir,
    onSort,
    className,
    stickyHeader = true,
    mobileVariant = "cards",
    compactPagination = true,
    onRowClick,
}: DataTableProps<T>) {
    const mobileColumns = getMobileColumns(columns);
    const showMobileCards = mobileVariant === "cards";

    return (
        <div className={cn("bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm", className)}>
            {showMobileCards && (
                <div className="md:hidden">
                    {loading ? (
                        <div className="py-16 flex flex-col items-center gap-2 text-slate-400">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span className="text-xs">Loading…</span>
                        </div>
                    ) : data.length === 0 ? (
                        <div className="py-8">
                            <EmptyState title={emptyTitle} description={emptyDescription} />
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {data.map((row) => (
                                <div
                                    key={rowKey(row)}
                                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                                    className={cn(
                                        "p-4 space-y-2.5",
                                        onRowClick && "cursor-pointer active:bg-violet-50/40"
                                    )}
                                >
                                    {mobileColumns.map((col) => (
                                        <div
                                            key={col.id}
                                            className={cn(
                                                "flex items-start justify-between gap-3",
                                                col.id === "actions" && "pt-1 border-t border-slate-50"
                                            )}
                                        >
                                            {col.id !== "actions" && (
                                                <span className="text-xs font-medium text-slate-500 shrink-0 pt-0.5">
                                                    {col.header}
                                                </span>
                                            )}
                                            <div
                                                className={cn(
                                                    "text-sm text-right min-w-0",
                                                    col.id === "actions" && "w-full flex justify-end",
                                                    col.className
                                                )}
                                            >
                                                {col.cell(row)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className={cn(showMobileCards ? "hidden md:block" : "", "overflow-x-auto")}>
                <table className="w-full text-sm">
                    <thead>
                        <tr
                            className={cn(
                                "border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-50/80",
                                stickyHeader && "sticky top-0 z-10"
                            )}
                        >
                            {columns.map((col) => (
                                <th
                                    key={col.id}
                                    className={cn(
                                        "text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider",
                                        col.hideOnMobile && "hidden md:table-cell",
                                        col.headerClassName
                                    )}
                                >
                                    {col.sortable && onSort ? (
                                        <button
                                            type="button"
                                            onClick={() => onSort(col.id)}
                                            className="inline-flex items-center gap-1 hover:text-slate-900 transition-colors"
                                        >
                                            {col.header}
                                            <SortIcon active={sortBy === col.id} dir={sortDir} />
                                        </button>
                                    ) : (
                                        col.header
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length} className="py-16">
                                    <div className="flex flex-col items-center gap-2 text-slate-400">
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                        <span className="text-xs">Loading…</span>
                                    </div>
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="py-8">
                                    <EmptyState
                                        title={emptyTitle}
                                        description={emptyDescription}
                                    />
                                </td>
                            </tr>
                        ) : (
                            data.map((row) => (
                                <tr
                                    key={rowKey(row)}
                                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                                    className={cn(
                                        "transition-colors",
                                        onRowClick && "cursor-pointer hover:bg-violet-50/40",
                                        !onRowClick && "hover:bg-slate-50/60"
                                    )}
                                >
                                    {columns.map((col) => (
                                        <td
                                            key={col.id}
                                            className={cn(
                                                "px-4 py-3 align-middle",
                                                col.hideOnMobile && "hidden md:table-cell",
                                                col.className
                                            )}
                                        >
                                            {col.cell(row)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {meta && onPageChange && (
                <Pagination
                    meta={meta}
                    page={page}
                    limit={limit}
                    onPageChange={onPageChange}
                    onLimitChange={onLimitChange}
                    compact={compactPagination}
                />
            )}
        </div>
    );
}

function SortIcon({ active, dir }: { active?: boolean; dir?: "asc" | "desc" }) {
    if (!active) return <ArrowUpDown className="h-3.5 w-3.5 text-slate-300" />;
    return dir === "asc"
        ? <ArrowUp className="h-3.5 w-3.5 text-violet-600" />
        : <ArrowDown className="h-3.5 w-3.5 text-violet-600" />;
}
