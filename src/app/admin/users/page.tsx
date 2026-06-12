"use client";
import { useState } from "react";
import { UserCheck, UserX, Trash2 } from "lucide-react";
import { toast } from "sonner";

import AdminPage from "@/components/admin/AdminPage";
import RoleBadge from "@/components/roles/RoleBadge";
import Avatar from "@/components/ui/Avatar";
import Select from "@/components/ui/Select";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { DataTable, TableFilters } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import {
    useGetAdminUsersQuery,
    useUpdateAdminUserMutation,
    useDeleteAdminUserMutation,
} from "@/lib/api/adminApi";
import { useGetProfileQuery } from "@/lib/api/authApi";
import { useTableState } from "@/hooks/useTableState";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { isSuperAdmin } from "@/hooks/usePermissions";
import { SYSTEM_ROLE_OPTIONS, type SystemRole } from "@/types/role.types";
import { formatDate } from "@/utils/formatDate";
import { parseApiError } from "@/utils/errorParser";
import { cn } from "@/utils/cn";
import type { User } from "@/types/auth.types";

const ROLE_FILTER = [
    { value: "", label: "All roles" },
    ...SYSTEM_ROLE_OPTIONS,
];
const STATUS_FILTER = [
    { value: "", label: "All statuses" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
];
const ADMIN_ROLES = SYSTEM_ROLE_OPTIONS.filter((r) => r.value !== "super_admin");

export default function AdminUsersPage() {
    const { data: profileData } = useGetProfileQuery();
    const currentUser = profileData?.data;
    const canDeleteUsers = isSuperAdmin(currentUser?.role);

    const table = useTableState({ limit: 15 });
    const debouncedSearch = useDebouncedValue(table.search);
    const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

    const { data, isLoading, isFetching } = useGetAdminUsersQuery({
        ...table.queryParams,
        search: debouncedSearch || undefined,
    });
    const [updateUser] = useUpdateAdminUserMutation();
    const [deleteUser, { isLoading: deleting }] = useDeleteAdminUserMutation();

    const users = data?.data ?? [];
    const meta = data?.meta;

    const handleRoleChange = async (userId: number, role: SystemRole) => {
        try {
            await updateUser({ userId, body: { role } }).unwrap();
            toast.success("Role updated");
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handleToggleActive = async (target: User) => {
        try {
            await updateUser({ userId: target.id, body: { isActive: !target.isActive } }).unwrap();
            toast.success(target.isActive ? "User deactivated" : "User activated");
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const columns: DataTableColumn<User>[] = [
        {
            id: "user",
            header: "User",
            primaryOnMobile: true,
            cell: (u) => (
                <div className="flex items-center gap-3 min-w-[200px]">
                    <Avatar src={u.avatar} name={u.name} size="sm" />
                    <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">
                            {u.name}
                            {u.id === currentUser?.id && (
                                <span className="text-slate-400 font-normal"> (you)</span>
                            )}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{u.email}</p>
                    </div>
                </div>
            ),
        },
        {
            id: "role",
            header: "Role",
            primaryOnMobile: true,
            cell: (u) =>
                u.id === currentUser?.id || (u.role === "super_admin" && !canDeleteUsers) ? (
                    <RoleBadge role={u.role} scope="system" />
                ) : (
                    <Select
                        options={canDeleteUsers ? SYSTEM_ROLE_OPTIONS : ADMIN_ROLES}
                        value={u.role}
                        onChange={(role) => handleRoleChange(u.id, role as SystemRole)}
                        size="sm"
                        className="w-32"
                    />
                ),
        },
        {
            id: "status",
            header: "Status",
            primaryOnMobile: true,
            cell: (u) => (
                <span className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    u.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                )}>
                    {u.isActive ? "Active" : "Inactive"}
                </span>
            ),
        },
        {
            id: "joined",
            header: "Joined",
            hideOnMobile: true,
            cell: (u) => (
                <span className="text-xs text-slate-500">{formatDate(u.createdAt)}</span>
            ),
        },
        {
            id: "actions",
            header: "Actions",
            primaryOnMobile: true,
            className: "text-right",
            headerClassName: "text-right",
            cell: (u) => (
                <div className="flex items-center justify-end gap-1">
                    {u.id !== currentUser?.id && (
                        <>
                            <button
                                onClick={() => handleToggleActive(u)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-100 text-slate-600 text-xs font-medium"
                                title={u.isActive ? "Deactivate" : "Activate"}
                            >
                                {u.isActive ? (
                                    <>
                                        <UserX className="h-3.5 w-3.5" />
                                        <span className="hidden sm:inline">Deactivate</span>
                                    </>
                                ) : (
                                    <>
                                        <UserCheck className="h-3.5 w-3.5" />
                                        <span className="hidden sm:inline">Activate</span>
                                    </>
                                )}
                            </button>
                            {canDeleteUsers && u.role !== "super_admin" && (
                                <button
                                    onClick={() => setDeleteTarget(u)}
                                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"
                                    title="Delete user"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}
                        </>
                    )}
                </div>
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
                        placeholder: "Search by name or email…",
                        value: table.search,
                        onChange: table.setSearch,
                    },
                    {
                        id: "role",
                        type: "select",
                        label: "Role",
                        options: ROLE_FILTER,
                        value: table.filters.role ?? "",
                        onChange: (v) => table.setFilter("role", v),
                        clearable: true,
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
                data={users}
                rowKey={(u) => u.id}
                loading={isLoading || isFetching}
                emptyTitle="No users found"
                meta={meta}
                page={table.page}
                limit={table.limit}
                onPageChange={table.setPage}
                onLimitChange={table.setLimit}
                stickyHeader={false}
            />

            <ConfirmDialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={async () => {
                    if (!deleteTarget) return;
                    try {
                        await deleteUser(deleteTarget.id).unwrap();
                        toast.success("User deleted");
                        setDeleteTarget(null);
                    } catch (err) {
                        toast.error(parseApiError(err));
                    }
                }}
                loading={deleting}
                title={`Delete ${deleteTarget?.name}?`}
                description="This permanently removes the user and cannot be undone."
                confirmLabel="Delete user"
                variant="danger"
            />
        </AdminPage>
    );
}
