"use client";
import Link from "next/link";
import AdminPage from "@/components/admin/AdminPage";
import { DataTable, TableFilters } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import { useGetAdminBoardsQuery, type AdminBoard } from "@/lib/api/adminApi";
import { useTableState } from "@/hooks/useTableState";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatDate } from "@/utils/formatDate";
import { cn } from "@/utils/cn";

const VISIBILITY_FILTER = [
    { value: "", label: "All visibility" },
    { value: "private", label: "Private" },
    { value: "workspace", label: "Workspace" },
    { value: "public", label: "Public" },
];
const CLOSED_FILTER = [
    { value: "", label: "All boards" },
    { value: "false", label: "Open" },
    { value: "true", label: "Closed" },
];

export default function AdminBoardsPage() {
    const table = useTableState({ limit: 15 });
    const debouncedSearch = useDebouncedValue(table.search);

    const { data, isLoading, isFetching } = useGetAdminBoardsQuery({
        ...table.queryParams,
        search: debouncedSearch || undefined,
    });

    const boards = data?.data ?? [];
    const meta = data?.meta;

    const columns: DataTableColumn<AdminBoard>[] = [
        {
            id: "name",
            header: "Board",
            primaryOnMobile: true,
            cell: (b) => (
                <div className="min-w-[160px]">
                    <p className="font-medium text-slate-900">{b.name}</p>
                    <p className="text-xs text-slate-500">{b.workspace?.name ?? `WS #${b.workspaceId}`}</p>
                </div>
            ),
        },
        {
            id: "visibility",
            header: "Visibility",
            primaryOnMobile: true,
            cell: (b) => (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 capitalize">
                    {b.visibility}
                </span>
            ),
        },
        {
            id: "status",
            header: "Status",
            primaryOnMobile: true,
            cell: (b) => (
                <span className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    b.isClosed ? "bg-slate-100 text-slate-600" : "bg-emerald-100 text-emerald-700"
                )}>
                    {b.isClosed ? "Closed" : "Open"}
                </span>
            ),
        },
        {
            id: "creator",
            header: "Created by",
            hideOnMobile: true,
            cell: (b) => (
                <span className="text-sm text-slate-700">{b.creator?.name ?? "—"}</span>
            ),
        },
        {
            id: "created",
            header: "Created",
            hideOnMobile: true,
            cell: (b) => <span className="text-xs text-slate-500">{formatDate(b.createdAt)}</span>,
        },
        {
            id: "actions",
            header: "",
            primaryOnMobile: true,
            className: "text-right",
            cell: (b) => (
                <Link
                    href={`/workspaces/${b.workspaceId}/boards/${b.id}?from=admin`}
                    className="text-xs font-medium text-violet-600 hover:text-violet-700"
                >
                    Open →
                </Link>
            ),
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
                        placeholder: "Search boards…",
                        value: table.search,
                        onChange: table.setSearch,
                    },
                    {
                        id: "visibility",
                        type: "select",
                        label: "Visibility",
                        options: VISIBILITY_FILTER,
                        value: table.filters.visibility ?? "",
                        onChange: (v) => table.setFilter("visibility", v),
                        clearable: true,
                    },
                    {
                        id: "closed",
                        type: "select",
                        label: "Status",
                        options: CLOSED_FILTER,
                        value: table.filters.closed ?? "",
                        onChange: (v) => table.setFilter("closed", v),
                        clearable: true,
                    },
                ]}
            />

            <DataTable
                columns={columns}
                data={boards}
                rowKey={(b) => b.id}
                loading={isLoading || isFetching}
                emptyTitle="No boards found"
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
