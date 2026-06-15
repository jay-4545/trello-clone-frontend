"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Briefcase, Search, LayoutGrid, List } from "lucide-react";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import WorkspaceCard, { CreateWorkspaceTile } from "@/components/workspace/WorkspaceCard";
import { WorkspaceCardSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import ErrorMessage from "@/components/ui/ErrorMessage";
import EditWorkspaceModal from "@/components/workspace/EditWorkspaceModal";
import RoleBadge from "@/components/roles/RoleBadge";
import Badge from "@/components/ui/Badge";
import { useGetMyWorkspacesQuery } from "@/lib/api/workspaceApi";
import type { Workspace } from "@/lib/api/workspaceApi";
import { useAuthToken } from "@/hooks/useAuthToken";
import { useAppDispatch } from "@/store";
import { setCreateWorkspaceModal } from "@/store/slices/uiSlice";
import { getWorkspaceColor } from "@/lib/workspaceColor";
import { cn } from "@/utils/cn";

export default function WorkspacesPage() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const hasToken = useAuthToken();
    const [search, setSearch] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [editTarget, setEditTarget] = useState<Workspace | null>(null);

    const openCreateModal = () => dispatch(setCreateWorkspaceModal(true));

    const { data, isLoading, isError, refetch } = useGetMyWorkspacesQuery(undefined, {
        skip: !hasToken,
    });
    const workspaces = data?.data ?? [];

    const filtered = workspaces.filter((ws) =>
        ws.name.toLowerCase().includes(search.toLowerCase()) ||
        ws.description?.toLowerCase().includes(search.toLowerCase())
    );

    const showCreateTile = !search && viewMode === "grid";

    return (
        <div className="min-h-full bg-[#f0f2f5]">
            {/* Header */}
            <div className="sticky top-14 lg:top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                                Workspaces
                            </h1>
                            <p className="text-sm text-slate-500 mt-1">
                                {isLoading
                                    ? "Loading your workspaces…"
                                    : `${workspaces.length} workspace${workspaces.length !== 1 ? "s" : ""} · Organize boards by team or project`}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex-1 sm:flex-initial sm:w-60 min-w-[160px]">
                                <Input
                                    placeholder="Search workspaces…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    leftElement={<Search className="h-3.5 w-3.5" />}
                                />
                            </div>
                            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden shrink-0 bg-white">
                                <button
                                    type="button"
                                    onClick={() => setViewMode("grid")}
                                    className={cn(
                                        "flex items-center justify-center h-9 w-9 transition-colors cursor-pointer",
                                        viewMode === "grid"
                                            ? "bg-blue-50 text-blue-600"
                                            : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                    )}
                                    aria-label="Grid view"
                                    aria-pressed={viewMode === "grid"}
                                >
                                    <LayoutGrid className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode("list")}
                                    className={cn(
                                        "flex items-center justify-center h-9 w-9 border-l border-slate-200 transition-colors cursor-pointer",
                                        viewMode === "list"
                                            ? "bg-blue-50 text-blue-600"
                                            : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                    )}
                                    aria-label="List view"
                                    aria-pressed={viewMode === "list"}
                                >
                                    <List className="h-4 w-4" />
                                </button>
                            </div>
                            <Button
                                leftIcon={<Plus className="h-4 w-4" />}
                                onClick={openCreateModal}
                            >
                                <span className="hidden sm:inline">New workspace</span>
                                <span className="sm:hidden">New</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                {isLoading && (
                    <div className={viewMode === "grid"
                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                        : "flex flex-col gap-3"
                    }>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <WorkspaceCardSkeleton key={i} />
                        ))}
                    </div>
                )}

                {isError && (
                    <ErrorMessage
                        message="Failed to load workspaces."
                        onRetry={refetch}
                    />
                )}

                {!isLoading && !isError && filtered.length === 0 && (
                    <EmptyState
                        icon={<Briefcase className="h-6 w-6" />}
                        title={search ? "No workspaces match your search" : "No workspaces yet"}
                        description={
                            search
                                ? "Try a different search term."
                                : "Create a workspace to start organising your team's work."
                        }
                        action={
                            !search
                                ? { label: "Create workspace", onClick: openCreateModal }
                                : undefined
                        }
                    />
                )}

                {!isLoading && !isError && filtered.length > 0 && (
                    viewMode === "grid" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filtered.map((ws) => (
                                <WorkspaceCard
                                    key={ws.id}
                                    workspace={ws}
                                    onEdit={setEditTarget}
                                />
                            ))}
                            {showCreateTile && (
                                <CreateWorkspaceTile onClick={openCreateModal} />
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {filtered.map((ws) => (
                                <WorkspaceListRow
                                    key={ws.id}
                                    workspace={ws}
                                    onEdit={setEditTarget}
                                    onClick={() => router.push(`/workspaces/${ws.id}`)}
                                />
                            ))}
                        </div>
                    )
                )}
            </div>

            {editTarget && (
                <EditWorkspaceModal
                    open={!!editTarget}
                    onClose={() => setEditTarget(null)}
                    workspace={editTarget}
                />
            )}
        </div>
    );
}

function WorkspaceListRow({
    workspace,
    onEdit,
    onClick,
}: {
    workspace: Workspace;
    onEdit: (ws: Workspace) => void;
    onClick: () => void;
}) {
    const accent = getWorkspaceColor(workspace.id);

    return (
        <div
            className="group flex items-center gap-4 bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-3.5 cursor-pointer hover:shadow-md transition-all"
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onClick();
                }
            }}
        >
            <div
                className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm"
                style={{ background: accent }}
            >
                {workspace.name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-900 truncate">{workspace.name}</p>
                    {workspace.isPersonal && (
                        <Badge variant="purple" size="sm">Personal</Badge>
                    )}
                    {workspace.myRole && (
                        <RoleBadge role={workspace.myRole} scope="workspace" />
                    )}
                </div>
                {workspace.description ? (
                    <p className="text-xs text-slate-500 truncate mt-0.5">{workspace.description}</p>
                ) : (
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                        {workspace.isPersonal ? "Just you" : `/${workspace.slug}`}
                    </p>
                )}
            </div>
            <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); onEdit(workspace); }}
                className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0"
            >
                Edit
            </Button>
        </div>
    );
}
