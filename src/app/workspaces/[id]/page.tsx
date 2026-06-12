"use client";
import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
    Plus,
    Star,
    Users,
    Lock,
    Globe,
    LayoutGrid,
    UserPlus,
    ChevronRight,
    RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui";
import EmptyState from "@/components/ui/EmptyState";
import RoleBadge from "@/components/roles/RoleBadge";
import ViewOnlyBanner from "@/components/roles/ViewOnlyBanner";
import AdminReturnBanner from "@/components/admin/AdminReturnBanner";
import CreateBoardModal from "@/components/workspace/CreateBoardModal";
import InviteMemberModal from "@/components/workspace/InviteMemberModal";
import WorkspaceMembersModal from "@/components/workspace/WorkspaceMembersModal";
import { useGetWorkspaceQuery, useGetWorkspaceMembersQuery } from "@/lib/api/workspaceApi";
import { useGetBoardsQuery, useUpdateBoardMutation } from "@/lib/api/boardApi";
import { useGetProfileQuery } from "@/lib/api/authApi";
import type { Board } from "@/lib/api/boardApi";
import { useWorkspacePermissions } from "@/hooks/usePermissions";
import { parseApiError } from "@/utils/errorParser";
import { cn } from "@/utils/cn";

const BOARD_COLORS = [
    "#0079BF", "#4BBC4E", "#FF9F1A", "#EB5A46",
    "#C377E0", "#FF78CB", "#00C2E0", "#0052CC",
    "#519839", "#B04632", "#89609E", "#CD5A91",
];

function getBoardColor(board: Board): string {
    if (board.background) return board.background;
    return BOARD_COLORS[board.id % BOARD_COLORS.length];
}

export default function WorkspaceDetailPage() {
    const params = useParams();
    const workspaceId = Number(params.id);
    const router = useRouter();
    const searchParams = useSearchParams();
    const fromAdmin = searchParams.get("from") === "admin";

    const [createBoardOpen, setCreateBoardOpen] = useState(false);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [membersOpen, setMembersOpen] = useState(false);

    const { data: wsData, isLoading: wsLoading } = useGetWorkspaceQuery(workspaceId);
    const { data: boardsData, isLoading: boardsLoading } = useGetBoardsQuery(workspaceId);
    const { data: closedBoardsData } = useGetBoardsQuery({ workspaceId, closedOnly: true });
    const { data: membersData } = useGetWorkspaceMembersQuery(workspaceId);
    const { data: profileData } = useGetProfileQuery();
    const [updateBoard] = useUpdateBoardMutation();

    const workspace = wsData?.data;
    const allBoards = boardsData?.data ?? [];
    const members = membersData?.data ?? [];
    const currentUserId = profileData?.data?.id;

    const activeBoards = allBoards.filter((b) => !b.isClosed);
    const closedBoards = closedBoardsData?.data ?? [];
    const starredBoards = activeBoards.filter((b) => b.isStarred);

    const { canManage, canCreateBoard, canInvite, isViewer } = useWorkspacePermissions(workspace?.myRole);

    const handleToggleStar = async (board: Board, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await updateBoard({
                workspaceId,
                boardId: board.id,
                body: { isStarred: !board.isStarred },
            }).unwrap();
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handleReopenBoard = async (board: Board) => {
        try {
            await updateBoard({
                workspaceId,
                boardId: board.id,
                body: { isClosed: false },
            }).unwrap();
            toast.success(`"${board.name}" reopened`);
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    if (wsLoading) {
        return (
            <div className="min-h-full bg-slate-50">
                <WorkspaceHeaderSkeleton />
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                    <BoardGridSkeleton />
                </div>
            </div>
        );
    }

    if (!workspace) {
        return (
            <div className="min-h-full bg-slate-50 flex items-center justify-center p-6">
                <EmptyState
                    icon={<LayoutGrid className="h-6 w-6" />}
                    title="Workspace not found"
                    description="This workspace doesn't exist or you don't have access."
                    action={{ label: "Back to workspaces", onClick: () => router.push("/workspaces") }}
                />
            </div>
        );
    }

    return (
        <div className="min-h-full bg-slate-50">
            {fromAdmin && <AdminReturnBanner href="/admin/workspaces" />}
            {isViewer && (
                <ViewOnlyBanner message="You're a workspace viewer. You can browse boards but cannot create or edit them." />
            )}
            {/* Workspace header */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
                            <div
                                className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl flex items-center justify-center text-white font-bold text-lg sm:text-xl shrink-0 shadow-sm"
                                style={{ background: `hsl(${(workspace.id * 47) % 360}, 65%, 50%)` }}
                            >
                                {workspace.name[0].toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                                        {workspace.name}
                                    </h1>
                                    {workspace.myRole && (
                                        <RoleBadge role={workspace.myRole} scope="workspace" />
                                    )}
                                </div>
                                {workspace.description && (
                                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5 line-clamp-2">
                                        {workspace.description}
                                    </p>
                                )}
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                    <button
                                        onClick={() => setMembersOpen(true)}
                                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                                    >
                                        <Users className="h-3.5 w-3.5" />
                                        {members.length} member{members.length !== 1 ? "s" : ""}
                                    </button>
                                    <span className="text-slate-200">·</span>
                                    <span className="text-xs text-slate-400 font-mono truncate">
                                        /{workspace.slug}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                            {canInvite && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    leftIcon={<UserPlus className="h-3.5 w-3.5" />}
                                    onClick={() => setInviteOpen(true)}
                                    className="flex-1 sm:flex-initial"
                                >
                                    Invite
                                </Button>
                            )}
                            {canCreateBoard && (
                                <Button
                                    size="sm"
                                    leftIcon={<Plus className="h-3.5 w-3.5" />}
                                    onClick={() => setCreateBoardOpen(true)}
                                    className="flex-1 sm:flex-initial"
                                >
                                    New board
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
                {/* Starred boards */}
                {starredBoards.length > 0 && (
                    <section>
                        <div className="flex items-center gap-2 mb-3 sm:mb-4">
                            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                            <h2 className="text-sm font-semibold text-slate-700">Starred boards</h2>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                            {starredBoards.map((board) => (
                                <BoardCard
                                    key={board.id}
                                    board={board}
                                    workspaceId={workspaceId}
                                    onToggleStar={handleToggleStar}
                                    canStar={canCreateBoard}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* All boards */}
                <section>
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <div className="flex items-center gap-2">
                            <LayoutGrid className="h-4 w-4 text-slate-400" />
                            <h2 className="text-sm font-semibold text-slate-700">
                                {isViewer ? "Available boards" : "Your boards"}
                            </h2>
                            {activeBoards.length > 0 && (
                                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                    {activeBoards.length}
                                </span>
                            )}
                        </div>
                    </div>

                    {boardsLoading ? (
                        <BoardGridSkeleton />
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                            {activeBoards.map((board) => (
                                <BoardCard
                                    key={board.id}
                                    board={board}
                                    workspaceId={workspaceId}
                                    onToggleStar={handleToggleStar}
                                    canStar={canCreateBoard}
                                />
                            ))}

                            {canCreateBoard && (
                                <button
                                    onClick={() => setCreateBoardOpen(true)}
                                    className="h-[100px] rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-blue-500 transition-all group"
                                >
                                    <Plus className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                    <span className="text-xs font-medium">Create board</span>
                                </button>
                            )}
                        </div>
                    )}
                </section>

                {/* Closed boards */}
                {closedBoards.length > 0 && (
                    <section>
                        <div className="flex items-center gap-2 mb-3 sm:mb-4">
                            <LayoutGrid className="h-4 w-4 text-slate-400" />
                            <h2 className="text-sm font-semibold text-slate-700">Closed boards</h2>
                        </div>
                        <div className="space-y-2">
                            {closedBoards.map((board) => (
                                <div
                                    key={board.id}
                                    className="flex items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl"
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-slate-900 truncate">{board.name}</p>
                                        {board.description && (
                                            <p className="text-xs text-slate-500 truncate">{board.description}</p>
                                        )}
                                    </div>
                                    {canManage && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleReopenBoard(board)}
                                            leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                                        >
                                            Reopen
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Members quick-view */}
                {members.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-slate-400" />
                                <h2 className="text-sm font-semibold text-slate-700">Members</h2>
                            </div>
                            <button
                                onClick={() => setMembersOpen(true)}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                            >
                                {canManage ? "Manage members" : "View members"}
                                <ChevronRight className="h-3 w-3" />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {members.map((m) => (
                                <div
                                    key={m.id}
                                    className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2"
                                >
                                    <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-[10px] font-bold shrink-0">
                                        {m.user.name[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-slate-800">{m.user.name}</p>
                                        <RoleBadge role={m.role} scope="workspace" className="mt-0.5" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            <CreateBoardModal
                open={createBoardOpen}
                onClose={() => setCreateBoardOpen(false)}
                workspaceId={workspaceId}
            />
            <InviteMemberModal
                open={inviteOpen}
                onClose={() => setInviteOpen(false)}
                workspaceId={workspaceId}
            />
            <WorkspaceMembersModal
                open={membersOpen}
                onClose={() => setMembersOpen(false)}
                workspaceId={workspaceId}
                canManage={canManage}
                currentUserId={currentUserId}
                ownerId={workspace.ownerId}
            />
        </div>
    );
}

function BoardCard({
    board,
    workspaceId,
    onToggleStar,
    canStar = true,
}: {
    board: Board;
    workspaceId: number;
    onToggleStar: (board: Board, e: React.MouseEvent) => void;
    canStar?: boolean;
}) {
    const bgColor = getBoardColor(board);

    return (
        <Link
            href={`/workspaces/${workspaceId}/boards/${board.id}`}
            className="group relative h-[100px] rounded-xl overflow-hidden flex flex-col justify-between p-3 shadow-sm hover:shadow-md transition-all"
            style={{ backgroundColor: bgColor }}
        >
            <div className="flex items-start justify-between relative z-10">
                <div>
                    {board.visibility === "private" && (
                        <div className="flex items-center gap-1 bg-black/20 rounded px-1.5 py-0.5">
                            <Lock className="h-2.5 w-2.5 text-white/80" />
                            <span className="text-[9px] text-white/80 font-medium">Private</span>
                        </div>
                    )}
                    {board.visibility === "public" && (
                        <div className="flex items-center gap-1 bg-black/20 rounded px-1.5 py-0.5">
                            <Globe className="h-2.5 w-2.5 text-white/80" />
                            <span className="text-[9px] text-white/80 font-medium">Public</span>
                        </div>
                    )}
                </div>
                {canStar && (
                    <button
                        onClick={(e) => onToggleStar(board, e)}
                        className={cn(
                            "flex items-center justify-center h-6 w-6 rounded transition-all hover:bg-black/20",
                            board.isStarred
                                ? "opacity-100"
                                : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                        )}
                        title={board.isStarred ? "Unstar board" : "Star board"}
                    >
                        <Star
                            className={cn(
                                "h-3.5 w-3.5",
                                board.isStarred
                                    ? "fill-amber-300 text-amber-300"
                                    : "text-white/70 hover:text-white"
                            )}
                        />
                    </button>
                )}
            </div>

            <div className="relative z-10">
                <p className="text-sm font-semibold text-white leading-snug line-clamp-2 drop-shadow-sm">
                    {board.name}
                </p>
            </div>

            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-xl" />
        </Link>
    );
}

function WorkspaceHeaderSkeleton() {
    return (
        <div className="bg-white border-b border-slate-200">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
                <div className="flex items-center gap-3 sm:gap-4">
                    <Skeleton className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-3 w-72 max-w-full" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function BoardGridSkeleton() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-[100px] rounded-xl" />
            ))}
        </div>
    );
}
