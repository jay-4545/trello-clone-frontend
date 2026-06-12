"use client";
import Link from "next/link";
import AdminPage from "@/components/admin/AdminPage";
import { DataTable, TableFilters } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import { useGetAdminWorkspacesQuery, type AdminWorkspace } from "@/lib/api/adminApi";
import { useTableState } from "@/hooks/useTableState";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatDate } from "@/utils/formatDate";

export default function AdminWorkspacesPage() {
    const table = useTableState({ limit: 15 });
    const debouncedSearch = useDebouncedValue(table.search);

    const { data, isLoading, isFetching } = useGetAdminWorkspacesQuery({
        ...table.queryParams,
        search: debouncedSearch || undefined,
    });

    const workspaces = data?.data ?? [];
    const meta = data?.meta;

    const columns: DataTableColumn<AdminWorkspace>[] = [
        {
            id: "name",
            header: "Workspace",
            primaryOnMobile: true,
            cell: (ws) => (
                <div className="min-w-[180px]">
                    <p className="font-medium text-slate-900">{ws.name}</p>
                    <p className="text-xs text-slate-500 font-mono">/{ws.slug}</p>
                </div>
            ),
        },
        {
            id: "owner",
            header: "Owner",
            primaryOnMobile: true,
            cell: (ws) => (
                <div className="min-w-0">
                    <p className="text-sm text-slate-800">{ws.owner?.name ?? "—"}</p>
                    <p className="text-xs text-slate-500 truncate">{ws.owner?.email}</p>
                </div>
            ),
        },
        {
            id: "type",
            header: "Type",
            primaryOnMobile: true,
            cell: (ws) => (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {ws.isPersonal ? "Personal" : "Team"}
                </span>
            ),
        },
        {
            id: "created",
            header: "Created",
            hideOnMobile: true,
            cell: (ws) => <span className="text-xs text-slate-500">{formatDate(ws.createdAt)}</span>,
        },
        {
            id: "actions",
            header: "",
            primaryOnMobile: true,
            className: "text-right",
            cell: (ws) => (
                <Link
                    href={`/workspaces/${ws.id}?from=admin`}
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
                        placeholder: "Search by name or slug…",
                        value: table.search,
                        onChange: table.setSearch,
                    },
                ]}
            />

            <DataTable
                columns={columns}
                data={workspaces}
                rowKey={(ws) => ws.id}
                loading={isLoading || isFetching}
                emptyTitle="No workspaces found"
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
