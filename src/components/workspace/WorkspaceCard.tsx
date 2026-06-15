"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    MoreHorizontal,
    Pencil,
    Trash2,
    Users,
    LayoutGrid,
    ArrowRight,
    Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import Badge from "@/components/ui/Badge";
import RoleBadge from "@/components/roles/RoleBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteWorkspaceMutation } from "@/lib/api/workspaceApi";
import { useWorkspacePermissions } from "@/hooks/usePermissions";
import { parseApiError } from "@/utils/errorParser";
import { getWorkspaceColor, getWorkspaceColorLight } from "@/lib/workspaceColor";
import { cn } from "@/utils/cn";
import type { Workspace } from "@/lib/api/workspaceApi";

interface Props {
    workspace: Workspace;
    onEdit?: (workspace: Workspace) => void;
}

export default function WorkspaceCard({ workspace, onEdit }: Props) {
    const router = useRouter();
    const [deleteWorkspace, { isLoading: deleting }] = useDeleteWorkspaceMutation();
    const [confirmDelete, setConfirmDelete] = useState(false);

    const { isOwner, canManage: canEdit } = useWorkspacePermissions(workspace.myRole);
    const accent = getWorkspaceColor(workspace.id);
    const accentLight = getWorkspaceColorLight(workspace.id);

    const open = () => router.push(`/workspaces/${workspace.id}`);

    const handleDelete = async () => {
        try {
            await deleteWorkspace(workspace.id).unwrap();
            toast.success(`"${workspace.name}" deleted`);
            setConfirmDelete(false);
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    return (
        <>
            <Card
                className="group relative overflow-hidden border-slate-200/80 hover:border-slate-300 hover:shadow-lg transition-all duration-200 cursor-pointer p-0"
                onClick={open}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        open();
                    }
                }}
                aria-label={`Open workspace ${workspace.name}`}
            >
                {/* Color accent bar */}
                <div className="h-1.5 w-full" style={{ background: accent }} />

                <CardContent className="pt-4 pb-3">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                            <div
                                className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-lg shadow-sm"
                                style={{ background: accent }}
                            >
                                {workspace.name[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-sm font-semibold text-slate-900 truncate">
                                        {workspace.name}
                                    </h3>
                                    {workspace.isPersonal && (
                                        <Badge variant="purple" size="sm" className="shrink-0">
                                            Personal
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 truncate mt-0.5">
                                    {workspace.isPersonal ? "Just you" : `/${workspace.slug}`}
                                </p>
                            </div>
                        </div>

                        <div onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className={cn(
                                            "flex items-center justify-center h-8 w-8 rounded-lg text-slate-400",
                                            "hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer outline-none",
                                            "opacity-100 sm:opacity-0 sm:group-hover:opacity-100",
                                            "data-[state=open]:opacity-100 data-[state=open]:bg-slate-100"
                                        )}
                                        aria-label="Workspace options"
                                    >
                                        <MoreHorizontal className="h-4 w-4" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="min-w-[200px]">
                                    <DropdownMenuLabel className="text-[10px] uppercase tracking-wider">
                                        Workspace actions
                                    </DropdownMenuLabel>
                                    {canEdit ? (
                                        <DropdownMenuItem onSelect={() => onEdit?.(workspace)}>
                                            <Pencil className="h-3.5 w-3.5" />
                                            Edit workspace
                                        </DropdownMenuItem>
                                    ) : (
                                        <div className="px-2 py-2 text-xs text-slate-400 italic">
                                            No edit permission
                                        </div>
                                    )}
                                    {isOwner && !workspace.isPersonal && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onSelect={() => setConfirmDelete(true)}
                                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                Delete workspace
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {workspace.description ? (
                        <p className="text-sm text-slate-500 line-clamp-2 mt-3 leading-relaxed">
                            {workspace.description}
                        </p>
                    ) : (
                        <p className="text-sm text-slate-400 italic mt-3">No description</p>
                    )}
                </CardContent>

                <CardFooter className="justify-between border-t border-slate-100 bg-slate-50/50 px-5 py-3 mt-0">
                    <div className="flex items-center gap-3 text-slate-500">
                        <span className="flex items-center gap-1.5 text-xs font-medium">
                            <LayoutGrid className="h-3.5 w-3.5" />
                            Boards
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-medium">
                            <Users className="h-3.5 w-3.5" />
                            Team
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {workspace.myRole && (
                            <RoleBadge role={workspace.myRole} scope="workspace" />
                        )}
                        <span
                            className="flex items-center justify-center h-7 w-7 rounded-lg opacity-0 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                            style={{ background: accentLight, color: accent }}
                        >
                            <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                    </div>
                </CardFooter>
            </Card>

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

export function CreateWorkspaceTile({ onClick }: { onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "group h-full min-h-[180px] rounded-xl border-2 border-dashed border-slate-300",
                "bg-white/60 hover:bg-white hover:border-blue-400 hover:shadow-md",
                "flex flex-col items-center justify-center gap-3 p-6 transition-all cursor-pointer"
            )}
        >
            <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                <Sparkles className="h-5 w-5" />
            </div>
            <div className="text-center">
                <p className="text-sm font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
                    Create workspace
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-[180px]">
                    Organize boards for a team or project
                </p>
            </div>
        </button>
    );
}
