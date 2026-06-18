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
    ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui";
import { Card, CardContent } from "@/components/ui/card";
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
import { useAuthToken } from "@/hooks/useAuthToken";
import { parseApiError } from "@/utils/errorParser";
import { cn } from "@/utils/cn";
import { getBoardColor } from "@/lib/boardColors";
import { getWorkspaceColor, getWorkspaceColorLight } from "@/lib/workspaceColor";

function getBoardColorFromBoard(board: Board): string {
    return getBoardColor(board.background, board.id);
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

    const sessionReady = useAuthToken();

    const {
        data: wsData,
        isLoading: wsLoading,
        isFetching: wsFetching,
        isError: wsIsError,
        error: wsQueryError,
        isUninitialized: wsUninitialized,
        refetch: refetchWorkspace,
    } = useGetWorkspaceQuery(workspaceId, { skip: !sessionReady });
    const { data: boardsData, isLoading: boardsLoading } = useGetBoardsQuery(workspaceId, { skip: !sessionReady });
    const { data: closedBoardsData } = useGetBoardsQuery(
        { workspaceId, closedOnly: true },
        { skip: !sessionReady }
    );
    const { data: membersData } = useGetWorkspaceMembersQuery(workspaceId, { skip: !sessionReady });
    const { data: profileData } = useGetProfileQuery(undefined, { skip: !sessionReady });
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

    if (!sessionReady || wsUninitialized || wsLoading || (wsFetching && !workspace)) {
        return (
            <div className="min-h-full bg-[#f0f2f5]">
                <WorkspaceHeaderSkeleton />
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                    <BoardGridSkeleton />
                </div>
            </div>
        );
    }

    if (wsIsError || !workspace) {
        const errorMessage = wsIsError
            ? parseApiError(wsQueryError)
            : "This workspace doesn't exist or you don't have access.";

        return (
            <div className="min-h-full bg-[#f0f2f5] flex items-center justify-center p-6">
                <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
                    <EmptyState
                        icon={<LayoutGrid className="h-6 w-6" />}
                        title="Couldn't load this workspace"
                        description={errorMessage}
                        className="py-0"
                    />
                    <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-center gap-2">
                        <Button variant="outline" onClick={() => refetchWorkspace()} className="w-full sm:w-auto">
                            Try again
                        </Button>
                        <Button onClick={() => router.push("/workspaces")} className="w-full sm:w-auto">
                            Back to workspaces
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const accent = getWorkspaceColor(workspace.id);
    const accentLight = getWorkspaceColorLight(workspace.id);

    return (
        <div className="min-h-full bg-[#f0f2f5]">
            {fromAdmin && <AdminReturnBanner href="/admin/workspaces" />}
            {isViewer && (
                <ViewOnlyBanner message="You're a workspace viewer. You can browse boards but cannot create or edit them." />
            )}

            {/* Colored banner */}
            <div className="relative h-28 sm:h-32" style={{ background: accent }}>
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/25" />
                <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-4">
                    <Link
                        href="/workspaces"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-white/80 hover:text-white transition-colors cursor-pointer"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        All workspaces
                    </Link>
                </div>
            </div>

            {/* Workspace header card */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-10 sm:-mt-12 relative z-10">
                <Card className="shadow-md border-slate-200/80 overflow-hidden">
                    <div className="h-1" style={{ background: accent }} />
                    <CardContent className="pt-5 pb-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex items-start gap-4 min-w-0 flex-1">
                                <div
                                    className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl sm:text-2xl shrink-0 shadow-md -mt-1 ring-4 ring-white"
                                    style={{ background: accent }}
                                >
                                    {workspace.name[0].toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1 pt-0.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
                                            {workspace.name}
                                        </h1>
                                        {workspace.isPersonal && (
                                            <Badge variant="purple" size="sm">Personal</Badge>
                                        )}
                                        {workspace.myRole && (
                                            <RoleBadge role={workspace.myRole} scope="workspace" />
                                        )}
                                    </div>
                                    {workspace.description ? (
                                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                                            {workspace.description}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic mt-1">No description</p>
                                    )}

                                    {/* Stats row */}
                                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                                        <button
                                            type="button"
                                            onClick={() => setMembersOpen(true)}
                                            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                        >
                                            <Users className="h-3.5 w-3.5" />
                                            {members.length} member{members.length !== 1 ? "s" : ""}
                                        </button>
                                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 px-2.5 py-1 rounded-lg bg-slate-50">
                                            <LayoutGrid className="h-3.5 w-3.5" />
                                            {activeBoards.length} board{activeBoards.length !== 1 ? "s" : ""}
                                        </span>
                                        {!workspace.isPersonal && (
                                            <span className="text-xs text-slate-400 font-mono">
                                                /{workspace.slug}
                                            </span>
                                        )}
                                    </div>

                                    {/* Member avatar stack */}
                                    {members.length > 0 && (
                                        <div className="flex items-center mt-3">
                                            <div className="flex -space-x-2">
                                                {members.slice(0, 6).map((m) => (
                                                    <div
                                                        key={m.id}
                                                        title={m.user.name}
                                                        className="h-7 w-7 rounded-full bg-white ring-2 ring-white flex items-center justify-center text-[10px] font-bold text-slate-700 shadow-sm"
                                                        style={{ background: accentLight }}
                                                    >
                                                        {m.user.name[0].toUpperCase()}
                                                    </div>
                                                ))}
                                            </div>
                                            {members.length > 6 && (
                                                <span className="ml-2 text-xs text-slate-400">
                                                    +{members.length - 6} more
                                                </span>
                                            )}
                                        </div>
                                    )}
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
                    </CardContent>
                </Card>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
                {/* Starred boards */}
                {starredBoards.length > 0 && (
                    <section>
                        <SectionHeader
                            icon={<Star className="h-4 w-4 text-amber-400 fill-amber-400" />}
                            title="Starred boards"
                            count={starredBoards.length}
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
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
                    <SectionHeader
                        icon={<LayoutGrid className="h-4 w-4 text-slate-400" />}
                        title={isViewer ? "Available boards" : "Your boards"}
                        count={activeBoards.length}
                    />

                    {boardsLoading ? (
                        <BoardGridSkeleton />
                    ) : activeBoards.length === 0 && !canCreateBoard ? (
                        <Card className="border-dashed">
                            <CardContent className="py-10">
                                <EmptyState
                                    icon={<LayoutGrid className="h-6 w-6" />}
                                    title="No boards yet"
                                    description="This workspace doesn't have any boards you can access."
                                />
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
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
                                    type="button"
                                    onClick={() => setCreateBoardOpen(true)}
                                    className="h-[120px] rounded-xl border-2 border-dashed border-slate-300 bg-white/70 hover:border-blue-400 hover:bg-blue-50/80 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-blue-600 transition-all group cursor-pointer"
                                >
                                    <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-slate-100 group-hover:bg-blue-100 transition-colors">
                                        <Plus className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                    </div>
                                    <span className="text-xs font-semibold">Create new board</span>
                                </button>
                            )}
                        </div>
                    )}
                </section>

                {/* Closed boards */}
                {closedBoards.length > 0 && (
                    <section>
                        <SectionHeader
                            icon={<LayoutGrid className="h-4 w-4 text-slate-400" />}
                            title="Closed boards"
                            count={closedBoards.length}
                        />
                        <Card>
                            <CardContent className="p-0 divide-y divide-slate-100">
                                {closedBoards.map((board) => (
                                    <div
                                        key={board.id}
                                        className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-slate-50/80 transition-colors"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div
                                                className="h-8 w-12 rounded-md shrink-0"
                                                style={{ background: getBoardColorFromBoard(board) }}
                                            />
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-slate-900 truncate">{board.name}</p>
                                                {board.description && (
                                                    <p className="text-xs text-slate-500 truncate">{board.description}</p>
                                                )}
                                            </div>
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
                            </CardContent>
                        </Card>
                    </section>
                )}

                {/* Members */}
                {members.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <SectionHeader
                                icon={<Users className="h-4 w-4 text-slate-400" />}
                                title="Members"
                                count={members.length}
                                inline
                            />
                            <button
                                type="button"
                                onClick={() => setMembersOpen(true)}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 cursor-pointer"
                            >
                                {canManage ? "Manage members" : "View members"}
                                <ChevronRight className="h-3 w-3" />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {members.map((m) => (
                                <Card
                                    key={m.id}
                                    className="hover:shadow-md hover:border-slate-300 transition-all"
                                >
                                    <CardContent className="flex items-center gap-3 py-4">
                                        <div
                                            className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                                            style={{ background: accentLight, color: accent }}
                                        >
                                            {m.user.name[0].toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-slate-800 truncate">
                                                {m.user.name}
                                                {m.userId === currentUserId && (
                                                    <span className="text-slate-400 font-normal ml-1">(you)</span>
                                                )}
                                            </p>
                                            <p className="text-xs text-slate-400 truncate">{m.user.email}</p>
                                        </div>
                                        <RoleBadge role={m.role} scope="workspace" />
                                    </CardContent>
                                </Card>
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

function SectionHeader({
    icon,
    title,
    count,
    inline,
}: {
    icon: React.ReactNode;
    title: string;
    count?: number;
    inline?: boolean;
}) {
    return (
        <div className={cn("flex items-center gap-2", !inline && "mb-3 sm:mb-4")}>
            {icon}
            <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
            {count !== undefined && count > 0 && (
                <span className="text-xs text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                    {count}
                </span>
            )}
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
    const bgColor = getBoardColorFromBoard(board);

    return (
        <Link
            href={`/workspaces/${workspaceId}/boards/${board.id}`}
            className="group relative h-[120px] rounded-xl overflow-hidden flex flex-col justify-between p-3.5 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer"
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
                        type="button"
                        onClick={(e) => onToggleStar(board, e)}
                        className={cn(
                            "flex items-center justify-center h-7 w-7 rounded-md transition-all hover:bg-black/20 cursor-pointer",
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
        <>
            <Skeleton className="h-28 sm:h-32 w-full rounded-none" />
            <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-10 relative z-10">
                <Card>
                    <CardContent className="pt-5 pb-5">
                        <div className="flex items-start gap-4">
                            <Skeleton className="h-16 w-16 rounded-2xl shrink-0" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-4 w-72 max-w-full" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

function BoardGridSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-[120px] rounded-xl" />
            ))}
        </div>
    );
}
