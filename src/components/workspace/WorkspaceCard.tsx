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
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useDeleteWorkspaceMutation } from "@/lib/api/workspaceApi";
import { parseApiError } from "@/utils/errorParser";
import type { Workspace } from "@/lib/api/workspaceApi";

interface Props {
    workspace: Workspace;
    onEdit?: (workspace: Workspace) => void;
}

const ROLE_VARIANT: Record<string, "success" | "info" | "warning" | "default"> = {
    owner: "success",
    admin: "info",
    member: "default",
    viewer: "warning",
};

export default function WorkspaceCard({ workspace, onEdit }: Props) {
    const router = useRouter();
    const [deleteWorkspace, { isLoading: deleting }] = useDeleteWorkspaceMutation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const isOwner = workspace.myRole === "owner";
    const canEdit = workspace.myRole === "owner" || workspace.myRole === "admin";

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
                        <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
                            onClick={() => setMenuOpen((v) => !v)}
                            aria-label="Workspace options"
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>

                        {menuOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setMenuOpen(false)}
                                />
                                <div className="absolute right-0 top-8 z-20 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[160px]">
                                    {canEdit && (
                                        <button
                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                            onClick={() => {
                                                setMenuOpen(false);
                                                onEdit?.(workspace);
                                            }}
                                        >
                                            <Pencil className="h-4 w-4" />
                                            Edit workspace
                                        </button>
                                    )}
                                    {isOwner && (
                                        <button
                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                            onClick={() => {
                                                setMenuOpen(false);
                                                setConfirmDelete(true);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Delete workspace
                                        </button>
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
                        <Badge variant={ROLE_VARIANT[workspace.myRole] ?? "default"}>
                            {workspace.myRole}
                        </Badge>
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