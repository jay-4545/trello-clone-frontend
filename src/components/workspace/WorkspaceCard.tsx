// src/components/workspace/WorkspaceCard.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    MoreHorizontal,
    Pencil,
    Trash2,
    Users,
    LayoutGrid,
} from "lucide-react";
import { toast } from "sonner";

import Avatar from "@/components/ui/Avatar";
import RoleBadge from "@/components/roles/RoleBadge";
import Button from "@/components/ui/Button";
import { useWorkspacePermissions } from "@/hooks/usePermissions";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useDeleteWorkspaceMutation } from "@/lib/api/workspaceApi";
import { parseApiError } from "@/utils/errorParser";
import type { Workspace } from "@/lib/api/workspaceApi";

interface Props {
    workspace: Workspace;
    onEdit?: (workspace: Workspace) => void;
}

export default function WorkspaceCard({ workspace, onEdit }: Props) {
    const router = useRouter();
    const [deleteWorkspace, { isLoading: deleting }] = useDeleteWorkspaceMutation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const { isOwner, canManage: canEdit } = useWorkspacePermissions(workspace.myRole);

    const handleDelete = async () => {
        try {
            await deleteWorkspace(workspace.id).unwrap();
            toast.success("Workspace deleted");
            setConfirmDelete(false);
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    return (
        <>
            <div
                className="group bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200 p-5 cursor-pointer"
                onClick={() => router.push(`/workspaces/${workspace.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/workspaces/${workspace.id}`);
                    }
                }}
                aria-label={`Open workspace ${workspace.name}`}
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                        {/* Workspace icon */}
                        <div
                            className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 text-white font-bold text-base"
                            style={{
                                background: `hsl(${(workspace.id * 47) % 360}, 65%, 55%)`,
                            }}
                        >
                            {workspace.name[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-slate-900 truncate">
                                {workspace.name}
                            </h3>
                            <p className="text-xs text-slate-400 truncate">
                                /{workspace.slug}
                            </p>
                        </div>
                    </div>

                    {/* Kebab menu */}
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            className={`flex items-center justify-center h-7 w-7 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all ${
                                menuOpen
                                    ? "opacity-100 bg-slate-100 text-slate-700"
                                    : "opacity-0 group-hover:opacity-100 focus:opacity-100"
                            }`}
                            onClick={() => setMenuOpen((v) => !v)}
                            aria-label="Workspace options"
                            aria-expanded={menuOpen}
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </button>

                        {menuOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-30"
                                    onClick={() => setMenuOpen(false)}
                                />
                                <div className="absolute right-0 top-9 z-40 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 min-w-[200px] animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-150 origin-top-right">
                                    <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                            Workspace actions
                                        </p>
                                    </div>
                                    {canEdit && (
                                        <button
                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                            onClick={() => {
                                                setMenuOpen(false);
                                                onEdit?.(workspace);
                                            }}
                                        >
                                            <span className="flex items-center justify-center h-7 w-7 rounded-md bg-blue-50 text-blue-600">
                                                <Pencil className="h-3.5 w-3.5" />
                                            </span>
                                            <span className="flex-1 text-left">Edit workspace</span>
                                        </button>
                                    )}
                                    {!canEdit && (
                                        <div className="px-3 py-2 text-xs text-slate-400 italic">
                                            You don&apos;t have permission to edit this workspace.
                                        </div>
                                    )}
                                    {isOwner && (
                                        <>
                                            <div className="my-1 border-t border-slate-100" />
                                            <button
                                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                onClick={() => {
                                                    setMenuOpen(false);
                                                    setConfirmDelete(true);
                                                }}
                                            >
                                                <span className="flex items-center justify-center h-7 w-7 rounded-md bg-red-50 text-red-600">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </span>
                                                <span className="flex-1 text-left">Delete workspace</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Description */}
                {workspace.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                        {workspace.description}
                    </p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-3 text-slate-500">
                        <span className="flex items-center gap-1 text-xs">
                            <LayoutGrid className="h-3.5 w-3.5" />
                            Boards
                        </span>
                        <span className="flex items-center gap-1 text-xs">
                            <Users className="h-3.5 w-3.5" />
                            Members
                        </span>
                    </div>
                    {workspace.myRole && (
                        <RoleBadge role={workspace.myRole} scope="workspace" />
                    )}
                </div>
            </div>

            <ConfirmDialog
                open={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirm={handleDelete}
                loading={deleting}
                title="Delete workspace?"
                description={`This will permanently delete "${workspace.name}" and all its boards, lists, and cards. This action cannot be undone.`}
                confirmLabel="Delete workspace"
            />
        </>
    );
}