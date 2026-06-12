"use client";
import Link from "next/link";
import AdminPage from "@/components/admin/AdminPage";
import { DataTable, TableFilters } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import { useGetAdminCardsQuery, type AdminCard } from "@/lib/api/adminApi";
import { useTableState } from "@/hooks/useTableState";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatDate } from "@/utils/formatDate";
import { cn } from "@/utils/cn";

const STATUS_FILTER = [
    { value: "", label: "All statuses" },
    { value: "open", label: "Open" },
    { value: "in_progress", label: "In Progress" },
    { value: "in_review", label: "In Review" },
    { value: "done", label: "Done" },
];
const ARCHIVED_FILTER = [
    { value: "", label: "All cards" },
    { value: "false", label: "Active" },
    { value: "true", label: "Archived" },
];

export default function AdminCardsPage() {
    const table = useTableState({ limit: 15 });
    const debouncedSearch = useDebouncedValue(table.search);

    const { data, isLoading, isFetching } = useGetAdminCardsQuery({
        ...table.queryParams,
        search: debouncedSearch || undefined,
    });

    const cards = data?.data ?? [];
    const meta = data?.meta;

    const columns: DataTableColumn<AdminCard>[] = [
        {
            id: "title",
            header: "Card",
            primaryOnMobile: true,
            cell: (c) => (
                <div className="min-w-[180px]">
                    <p className="font-medium text-slate-900 truncate">{c.title}</p>
                    <p className="text-xs text-slate-500">{c.board?.name ?? `Board #${c.boardId}`}</p>
                </div>
            ),
        },
        {
            id: "status",
            header: "Status",
            primaryOnMobile: true,
            cell: (c) => (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize">
                    {c.status.replace(/_/g, " ")}
                </span>
            ),
        },
        {
            id: "priority",
            header: "Priority",
            primaryOnMobile: true,
            cell: (c) => (
                <span className={cn(
                    "text-xs font-semibold uppercase px-2 py-0.5 rounded",
                    c.priority === "critical" && "bg-red-100 text-red-700",
                    c.priority === "high" && "bg-orange-100 text-orange-700",
                    c.priority === "medium" && "bg-blue-100 text-blue-700",
                    c.priority === "low" && "bg-slate-100 text-slate-600",
                )}>
                    {c.priority}
                </span>
            ),
        },
        {
            id: "archived",
            header: "Archived",
            hideOnMobile: true,
            cell: (c) => (
                <span className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    c.isArchived ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                )}>
                    {c.isArchived ? "Yes" : "No"}
                </span>
            ),
        },
        {
            id: "creator",
            header: "Created by",
            hideOnMobile: true,
            cell: (c) => <span className="text-sm text-slate-700">{c.creator?.name ?? "—"}</span>,
        },
        {
            id: "created",
            header: "Created",
            hideOnMobile: true,
            cell: (c) => <span className="text-xs text-slate-500">{formatDate(c.createdAt)}</span>,
        },
        {
            id: "actions",
            header: "",
            primaryOnMobile: true,
            className: "text-right",
            cell: (c) => {
                const workspaceId = c.board?.workspaceId;
                if (!workspaceId) return <span className="text-xs text-slate-400">—</span>;
                return (
                    <Link
                        href={`/workspaces/${workspaceId}/boards/${c.boardId}?from=admin`}
                        className="text-xs font-medium text-violet-600 hover:text-violet-700"
                    >
                        View board →
                    </Link>
                );
            },
        },
    ];

    return (
        <AdminPage>
            <TableFilters
                hasActiveFilters={table.hasActiveFilters}
                onReset={table.resetAll}
                fields={[
                    {
                        id: "search",
                        type: "search",
                        placeholder: "Search by title…",
                        value: table.search,
                        onChange: table.setSearch,
                    },
                    {
                        id: "status",
                        type: "select",
                        label: "Status",
                        options: STATUS_FILTER,
                        value: table.filters.status ?? "",
                        onChange: (v) => table.setFilter("status", v),
                        clearable: true,
                    },
                    {
                        id: "archived",
                        type: "select",
                        label: "Archive",
                        options: ARCHIVED_FILTER,
                        value: table.filters.archived ?? "",
                        onChange: (v) => table.setFilter("archived", v),
                        clearable: true,
                    },
                ]}
            />

            <DataTable
                columns={columns}
                data={cards}
                rowKey={(c) => c.id}
                loading={isLoading || isFetching}
                emptyTitle="No cards found"
                meta={meta}
                page={table.page}
                limit={table.limit}
                onPageChange={table.setPage}
                onLimitChange={table.setLimit}
                stickyHeader={false}
            />
        </AdminPage>
    );
}
