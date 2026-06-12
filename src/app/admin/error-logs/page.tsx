"use client";
import { useState } from "react";
import AdminPage from "@/components/admin/AdminPage";
import Modal from "@/components/ui/Modal";
import { DataTable, TableFilters } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import {
    useGetAdminErrorLogsQuery,
    useGetAdminErrorLogByIdQuery,
    type AdminErrorLog,
} from "@/lib/api/adminApi";
import { useTableState } from "@/hooks/useTableState";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatDate } from "@/utils/formatDate";
import { cn } from "@/utils/cn";

const SOURCE_FILTER = [
    { value: "", label: "All sources" },
    { value: "error_middleware", label: "API errors" },
    { value: "auth", label: "Auth" },
    { value: "validation", label: "Validation" },
    { value: "rbac", label: "Access control" },
    { value: "not_found", label: "Not found" },
    { value: "socket", label: "Socket" },
];

const LEVEL_FILTER = [
    { value: "", label: "All levels" },
    { value: "error", label: "Error" },
    { value: "warning", label: "Warning" },
];

const STATUS_FILTER = [
    { value: "", label: "All status codes" },
    { value: "400", label: "400 Bad request" },
    { value: "401", label: "401 Unauthorized" },
    { value: "403", label: "403 Forbidden" },
    { value: "404", label: "404 Not found" },
    { value: "409", label: "409 Conflict" },
    { value: "500", label: "500 Server error" },
];

function statusBadgeClass(code: number) {
    if (code >= 500) return "bg-red-100 text-red-700";
    if (code >= 400) return "bg-amber-100 text-amber-800";
    return "bg-slate-100 text-slate-700";
}

function sourceLabel(source: string) {
    return SOURCE_FILTER.find((s) => s.value === source)?.label ?? source;
}

export default function AdminErrorLogsPage() {
    const table = useTableState({ limit: 15 });
    const debouncedSearch = useDebouncedValue(table.search);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const { data, isLoading, isFetching } = useGetAdminErrorLogsQuery({
        ...table.queryParams,
        search: debouncedSearch || undefined,
        source: table.filters.source || undefined,
        level: table.filters.level || undefined,
        statusCode: table.filters.statusCode ? +table.filters.statusCode : undefined,
    });

    const { data: detailData, isLoading: detailLoading } = useGetAdminErrorLogByIdQuery(
        selectedId!,
        { skip: selectedId == null }
    );

    const logs = data?.data ?? [];
    const meta = data?.meta;
    const detail = detailData?.data;

    const columns: DataTableColumn<AdminErrorLog>[] = [
        {
            id: "level",
            header: "Level",
            primaryOnMobile: true,
            cell: (log) => (
                <span className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide",
                    log.level === "error" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"
                )}>
                    {log.level}
                </span>
            ),
        },
        {
            id: "status",
            header: "Status",
            primaryOnMobile: true,
            cell: (log) => (
                <span className={cn("text-xs font-mono font-semibold px-2 py-0.5 rounded", statusBadgeClass(log.statusCode))}>
                    {log.statusCode}
                </span>
            ),
        },
        {
            id: "message",
            header: "Message",
            primaryOnMobile: true,
            cell: (log) => (
                <div className="min-w-[200px] max-w-md">
                    <p className="text-sm font-medium text-slate-800 line-clamp-2">{log.message}</p>
                    <p className="text-xs text-slate-500 mt-0.5 font-mono truncate">{log.path}</p>
                </div>
            ),
        },
        {
            id: "source",
            header: "Source",
            hideOnMobile: true,
            cell: (log) => (
                <span className="text-xs text-slate-600">{sourceLabel(log.source)}</span>
            ),
        },
        {
            id: "method",
            header: "Method",
            hideOnMobile: true,
            cell: (log) => (
                <span className="text-xs font-mono text-slate-600">{log.method}</span>
            ),
        },
        {
            id: "user",
            header: "User",
            hideOnMobile: true,
            cell: (log) => (
                <div className="min-w-[120px]">
                    {log.user ? (
                        <>
                            <p className="text-xs font-medium text-slate-700 truncate">{log.user.name}</p>
                            <p className="text-[11px] text-slate-500 truncate">{log.user.email}</p>
                        </>
                    ) : (
                        <span className="text-xs text-slate-400">—</span>
                    )}
                </div>
            ),
        },
        {
            id: "created",
            header: "When",
            hideOnMobile: true,
            cell: (log) => <span className="text-xs text-slate-500">{formatDate(log.createdAt)}</span>,
        },
        {
            id: "actions",
            header: "",
            cell: (log) => (
                <button
                    type="button"
                    onClick={() => setSelectedId(log.id)}
                    className="text-xs font-medium text-violet-600 hover:text-violet-800"
                >
                    Details
                </button>
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
                        placeholder: "Search message, path, request ID…",
                        value: table.search,
                        onChange: table.setSearch,
                    },
                    {
                        id: "source",
                        type: "select",
                        label: "Source",
                        options: SOURCE_FILTER,
                        value: table.filters.source ?? "",
                        onChange: (v) => table.setFilter("source", v),
                        clearable: true,
                    },
                    {
                        id: "level",
                        type: "select",
                        label: "Level",
                        options: LEVEL_FILTER,
                        value: table.filters.level ?? "",
                        onChange: (v) => table.setFilter("level", v),
                        clearable: true,
                    },
                    {
                        id: "statusCode",
                        type: "select",
                        label: "Status",
                        options: STATUS_FILTER,
                        value: table.filters.statusCode ?? "",
                        onChange: (v) => table.setFilter("statusCode", v),
                        clearable: true,
                    },
                ]}
            />

            <DataTable
                columns={columns}
                data={logs}
                rowKey={(log) => log.id}
                loading={isLoading || isFetching}
                emptyTitle="No error logs found"
                meta={meta}
                page={table.page}
                limit={table.limit}
                onPageChange={table.setPage}
                onLimitChange={table.setLimit}
                stickyHeader={false}
            />

            <Modal
                open={selectedId != null}
                onClose={() => setSelectedId(null)}
                title="Error log details"
                size="xl"
                className="max-h-[90vh] overflow-y-auto"
            >
                {detailLoading && (
                    <p className="text-sm text-slate-500">Loading details…</p>
                )}
                {detail && (
                    <div className="space-y-4 -mt-2">
                        <DetailGrid
                            items={[
                                ["ID", String(detail.id)],
                                ["Request ID", detail.requestId ?? "—"],
                                ["Level", detail.level],
                                ["Source", sourceLabel(detail.source)],
                                ["Status", String(detail.statusCode)],
                                ["Method", detail.method],
                                ["Path", detail.path],
                                ["Error name", detail.errorName ?? "—"],
                                ["Operational", detail.isOperational ? "Yes" : "No"],
                                ["Duration", detail.durationMs != null ? `${detail.durationMs}ms` : "—"],
                                ["IP", detail.ip ?? "—"],
                                ["When", formatDate(detail.createdAt)],
                            ]}
                        />

                        {detail.user && (
                            <section>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">User</h3>
                                <p className="text-sm text-slate-800">{detail.user.name} ({detail.user.email})</p>
                            </section>
                        )}

                        <section>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Message</h3>
                            <p className="text-sm text-slate-800 whitespace-pre-wrap break-words">{detail.message}</p>
                        </section>

                        {detail.responseMessage && detail.responseMessage !== detail.message && (
                            <section>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Response message</h3>
                                <p className="text-sm text-slate-700">{detail.responseMessage}</p>
                            </section>
                        )}

                        {detail.validationErrors && detail.validationErrors.length > 0 && (
                            <section>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Validation errors</h3>
                                <ul className="list-disc list-inside text-sm text-slate-700 space-y-0.5">
                                    {detail.validationErrors.map((e) => (
                                        <li key={e}>{e}</li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {detail.userAgent && (
                            <section>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">User agent</h3>
                                <p className="text-xs text-slate-600 break-all">{detail.userAgent}</p>
                            </section>
                        )}

                        {detail.query && Object.keys(detail.query).length > 0 && (
                            <JsonBlock title="Query params" data={detail.query} />
                        )}

                        {detail.body && Object.keys(detail.body).length > 0 && (
                            <JsonBlock title="Request body (sanitized)" data={detail.body} />
                        )}

                        {detail.context && Object.keys(detail.context).length > 0 && (
                            <JsonBlock title="Context" data={detail.context} />
                        )}

                        {detail.stack && (
                            <section>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Stack trace</h3>
                                <pre className="text-xs bg-slate-900 text-slate-100 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words max-h-64">
                                    {detail.stack}
                                </pre>
                            </section>
                        )}
                    </div>
                )}
            </Modal>
        </AdminPage>
    );
}

function DetailGrid({ items }: { items: [string, string][] }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {items.map(([label, value]) => (
                <div key={label} className="bg-slate-50 rounded-lg px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                    <p className="text-slate-800 break-all font-mono text-xs mt-0.5">{value}</p>
                </div>
            ))}
        </div>
    );
}

function JsonBlock({ title, data }: { title: string; data: Record<string, unknown> }) {
    return (
        <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{title}</h3>
            <pre className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words max-h-40">
                {JSON.stringify(data, null, 2)}
            </pre>
        </section>
    );
}
