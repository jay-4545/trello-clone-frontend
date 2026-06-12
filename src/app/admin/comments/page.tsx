"use client";
import AdminPage from "@/components/admin/AdminPage";
import Avatar from "@/components/ui/Avatar";
import { DataTable, TableFilters } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import { useGetAdminCommentsQuery, type AdminComment } from "@/lib/api/adminApi";
import { useTableState } from "@/hooks/useTableState";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatDate } from "@/utils/formatDate";
import { cn } from "@/utils/cn";

const STATUS_FILTER = [
    { value: "", label: "All comments" },
    { value: "active", label: "Active" },
    { value: "deleted", label: "Deleted" },
];

export default function AdminCommentsPage() {
    const table = useTableState({ limit: 15 });
    const debouncedSearch = useDebouncedValue(table.search);

    const { data, isLoading, isFetching } = useGetAdminCommentsQuery({
        ...table.queryParams,
        search: debouncedSearch || undefined,
    });

    const comments = data?.data ?? [];
    const meta = data?.meta;

    const columns: DataTableColumn<AdminComment>[] = [
        {
            id: "author",
            header: "Author",
            primaryOnMobile: true,
            cell: (c) => (
                <div className="flex items-center gap-2 min-w-[140px]">
                    <Avatar src={null} name={c.author?.name ?? "?"} size="sm" />
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{c.author?.name ?? "—"}</p>
                        <p className="text-xs text-slate-500 truncate">{c.author?.email}</p>
                    </div>
                </div>
            ),
        },
        {
            id: "content",
            header: "Comment",
            primaryOnMobile: true,
            cell: (c) => (
                <p className={cn(
                    "text-sm line-clamp-2",
                    c.isDeleted ? "text-slate-400 italic" : "text-slate-700"
                )}>
                    {c.isDeleted ? "[deleted]" : c.content}
                </p>
            ),
        },
        {
            id: "card",
            header: "Card",
            primaryOnMobile: true,
            cell: (c) => (
                <div className="min-w-0">
                    <p className="text-sm text-slate-800 truncate">{c.card?.title ?? `Card #${c.cardId}`}</p>
                    <p className="text-xs text-slate-500">Board #{c.card?.boardId}</p>
                </div>
            ),
        },
        {
            id: "status",
            header: "Status",
            primaryOnMobile: true,
            cell: (c) => (
                <div className="flex flex-col gap-1">
                    <span className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full w-fit",
                        c.isDeleted ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                    )}>
                        {c.isDeleted ? "Deleted" : "Active"}
                    </span>
                    {c.isEdited && !c.isDeleted && (
                        <span className="text-[10px] text-slate-400">Edited</span>
                    )}
                </div>
            ),
        },
        {
            id: "created",
            header: "Posted",
            hideOnMobile: true,
            cell: (c) => <span className="text-xs text-slate-500">{formatDate(c.createdAt)}</span>,
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
                        placeholder: "Search comment content…",
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
                ]}
            />

            <DataTable
                columns={columns}
                data={comments}
                rowKey={(c) => c.id}
                loading={isLoading || isFetching}
                emptyTitle="No comments found"
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
