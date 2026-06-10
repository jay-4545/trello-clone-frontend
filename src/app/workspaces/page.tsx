"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Briefcase, Search, LayoutGrid, List } from "lucide-react";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import WorkspaceCard from "@/components/workspace/WorkspaceCard";
import { WorkspaceCardSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import ErrorMessage from "@/components/ui/ErrorMessage";
import CreateWorkspaceModal from "@/components/workspace/CreateWorkspaceModal";
import EditWorkspaceModal from "@/components/workspace/EditWorkspaceModal";
import { useGetMyWorkspacesQuery } from "@/lib/api/workspaceApi";
import type { Workspace } from "@/lib/api/workspaceApi";

export default function WorkspacesPage() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [createOpen, setCreateOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Workspace | null>(null);

    const { data, isLoading, isError, refetch } = useGetMyWorkspacesQuery();
    const workspaces = data?.data ?? [];

    const filtered = workspaces.filter((ws) =>
        ws.name.toLowerCase().includes(search.toLowerCase()) ||
        ws.description?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-full">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg font-bold text-slate-900">Workspaces</h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {workspaces.length} workspace{workspaces.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex-1 sm:flex-initial sm:w-56 min-w-[160px]">
                            <Input
                                placeholder="Search workspaces…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                leftElement={<Search className="h-3.5 w-3.5" />}
                            />
                        </div>
                        <div className="hidden sm:flex items-center border border-slate-200 rounded-lg overflow-hidden">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`flex items-center justify-center h-9 w-9 transition-colors ${viewMode === "grid"
                                    ? "bg-blue-50 text-blue-600"
                                    : "bg-white text-slate-400 hover:text-slate-600"
                                    }`}
                                aria-label="Grid view"
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={`flex items-center justify-center h-9 w-9 border-l border-slate-200 transition-colors ${viewMode === "list"
                                    ? "bg-blue-50 text-blue-600"
                                    : "bg-white text-slate-400 hover:text-slate-600"
                                    }`}
                                aria-label="List view"
                            >
                                <List className="h-4 w-4" />
                            </button>
                        </div>
                        <Button
                            leftIcon={<Plus className="h-4 w-4" />}
                            onClick={() => setCreateOpen(true)}
                        >
                            <span className="hidden sm:inline">New workspace</span>
                            <span className="sm:hidden">New</span>
                        </Button>
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
                                ? { label: "Create workspace", onClick: () => setCreateOpen(true) }
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

            <CreateWorkspaceModal open={createOpen} onClose={() => setCreateOpen(false)} />
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
    return (
        <div
            className="flex items-center gap-4 bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-3 cursor-pointer hover:shadow-sm transition-all group"
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(); }}
        >
            <div
                className="h-9 w-9 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
                style={{ background: `hsl(${(workspace.id * 47) % 360}, 65%, 55%)` }}
            >
                {workspace.name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{workspace.name}</p>
                {workspace.description && (
                    <p className="text-xs text-slate-400 truncate">{workspace.description}</p>
                )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <span className="hidden sm:inline text-xs text-slate-400">/{workspace.slug}</span>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onEdit(workspace); }}
                    className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                >
                    Edit
                </Button>
            </div>
        </div>
    );
}
