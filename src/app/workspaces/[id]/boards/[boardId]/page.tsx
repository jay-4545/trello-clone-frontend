"use client";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    TouchSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    closestCorners,
    pointerWithin,
    rectIntersection,
    type DragStartEvent,
    type DragOverEvent,
    type DragEndEvent,
    type CollisionDetection,
} from "@dnd-kit/core";
import {
    SortableContext,
    horizontalListSortingStrategy,
    arrayMove,
    sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import {
    ArrowLeft,
    Star,
    Users,
    Plus,
    Lock,
    Globe,
    MoreHorizontal,
    X,
    Settings,
    Pencil,
    Trash2,
    Archive,
    ChevronDown,
    CheckSquare,
    LayoutGrid,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui";
import EmptyState from "@/components/ui/EmptyState";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import RoleBadge from "@/components/roles/RoleBadge";
import ViewOnlyBanner from "@/components/roles/ViewOnlyBanner";
import AdminReturnBanner from "@/components/admin/AdminReturnBanner";
import ListColumn from "@/components/board/ListColumn";
import { CardContent } from "@/components/board/CardItem";
import CardDetailModal from "@/components/board/CardDetailModal";
import BoardSettingsModal from "@/components/board/BoardSettingsModal";
import BoardMembersModal from "@/components/board/BoardMembersModal";
import BoardSearchBar from "@/components/board/BoardSearchBar";
import ArchivedItemsPanel from "@/components/board/ArchivedItemsPanel";
import BoardBottomNav, { BOARD_BOTTOM_NAV_HEIGHT } from "@/components/board/BoardBottomNav";
import BoardSwitcherSheet from "@/components/board/BoardSwitcherSheet";
import BoardPageSkeleton from "@/components/board/BoardPageSkeleton";
import {
    useGetBoardDetailQuery,
    useUpdateBoardMutation,
    useGetBoardMembersQuery,
} from "@/lib/api/boardApi";
import { useGetWorkspaceQuery } from "@/lib/api/workspaceApi";
import { useGetProfileQuery } from "@/lib/api/authApi";
import { useGetUnreadCountQuery } from "@/lib/api/notificationApi";
import {
    useGetListsQuery,
    useCreateListMutation,
    useReorderListsMutation,
} from "@/lib/api/listApi";
import {
    useMoveCardMutation,
    useReorderCardsMutation,
    useGetBoardStatsQuery,
    useBulkMoveCardsMutation,
} from "@/lib/api/cardApi";
import type { Card, CardStats } from "@/types/card.types";
import { parseApiError } from "@/utils/errorParser";
import { cn } from "@/utils/cn";
import { useBoardSocket } from "@/lib/socket/useBoardSocket";
import { useBoardPresence } from "@/lib/socket/useBoardPresence";
import { useBoardPermissions, isSystemAdmin } from "@/hooks/usePermissions";
import { useAuthToken } from "@/hooks/useAuthToken";
import { getBoardColor } from "@/lib/boardColors";
import { getBoardTheme, BOARD_SCROLLBAR_X_CLASS, BOARD_SCROLLBAR_Y_CLASS, getBoardScrollbarStyle } from "@/lib/boardTheme";

interface LocalList {
    id: number;
    name: string;
    position: number;
    cards: Card[];
}

export default function BoardDetailPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const workspaceId = Number(params.id);
    const boardId = Number(params.boardId);

    const sessionReady = useAuthToken();

    useBoardSocket(sessionReady ? boardId : null);

    const {
        data: boardData,
        isLoading: boardLoading,
        isFetching: boardFetching,
        isError: boardIsError,
        error: boardQueryError,
        isUninitialized: boardUninitialized,
        refetch: refetchBoard,
    } = useGetBoardDetailQuery(
        { workspaceId, boardId },
        { skip: !sessionReady }
    );
    const { data: listsData, isLoading: listsLoading } = useGetListsQuery(
        { workspaceId, boardId },
        { skip: !sessionReady }
    );
    const { data: wsData } = useGetWorkspaceQuery(workspaceId, { skip: !sessionReady });
    const { data: profileData } = useGetProfileQuery(undefined, { skip: !sessionReady });
    const { data: boardMembersData } = useGetBoardMembersQuery(
        { workspaceId, boardId },
        { skip: !sessionReady }
    );
    const [updateBoard] = useUpdateBoardMutation();
    const [createList, { isLoading: creatingList }] = useCreateListMutation();
    const [reorderLists] = useReorderListsMutation();
    const [moveCard] = useMoveCardMutation();
    const [reorderCards] = useReorderCardsMutation();
    const [bulkMoveCards, { isLoading: bulkMoving }] = useBulkMoveCardsMutation();
    const { data: statsData } = useGetBoardStatsQuery(
        { workspaceId, boardId },
        { skip: !sessionReady }
    );
    const { data: unreadData } = useGetUnreadCountQuery(undefined, { skip: !sessionReady });

    const fromAdmin = searchParams.get("from") === "admin";
    const board = boardData?.data;
    const serverLists = listsData?.data;
    const workspace = wsData?.data;
    const currentUser = profileData?.data;
    const unreadCount = unreadData?.data?.count ?? 0;
    const profileHref = isSystemAdmin(currentUser?.role) ? "/admin/profile" : "/profile";
    const boardMembers = boardMembersData?.data ?? [];
    const { viewingUsers, viewingCount } = useBoardPresence(boardId, boardMembers, currentUser?.id);

    const myBoardRole = boardMembers.find((m) => m.userId === currentUser?.id)?.role;
    const {
        canEditBoard,
        canManageBoard,
        canDeleteBoard,
        isViewOnly,
        effectiveBoardRole,
    } = useBoardPermissions(workspace?.myRole, myBoardRole);

    // Local state for drag and drop
    const [localLists, setLocalLists] = useState<LocalList[]>([]);
    const listsSnapshotRef = useRef<LocalList[] | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeDragData, setActiveDragData] = useState<{
        type: "card" | "list";
        card?: Card;
        list?: LocalList;
        originalListId?: number;
    } | null>(null);

    // Sync server data to local state
    useEffect(() => {
        if (!serverLists) return;
        const sorted = [...serverLists]
            .filter((l) => !l.isArchived)
            .sort((a, b) => a.position - b.position)
            .map((l) => ({
                id: l.id,
                name: l.name,
                position: l.position,
                cards: ((l.cards as Card[]) ?? [])
                    .filter((c) => !c.isArchived)
                    .sort((a, b) => a.position - b.position),
            }));
        setLocalLists(sorted);
    }, [serverLists]);

    // Inline add list
    const [addingList, setAddingList] = useState(false);
    const [newListName, setNewListName] = useState("");

    // Card detail modal
    const [detailCard, setDetailCard] = useState<Card | null>(null);

    const openedCardParamRef = useRef<string | null>(null);

    // Open card from ?card= query param (notification deep links) — run once per param
    useEffect(() => {
        const cardParam = searchParams.get("card");
        if (!cardParam || localLists.length === 0) return;
        if (openedCardParamRef.current === cardParam) return;

        const cardId = Number(cardParam);
        if (Number.isNaN(cardId)) return;

        for (const list of localLists) {
            const found = list.cards.find((c) => c.id === cardId);
            if (found) {
                openedCardParamRef.current = cardParam;
                setDetailCard(found);
                return;
            }
        }
    }, [searchParams, localLists]);

    const rollbackLists = useCallback(() => {
        if (listsSnapshotRef.current) {
            setLocalLists(listsSnapshotRef.current);
            listsSnapshotRef.current = null;
        }
    }, []);

    const persistWithRollback = useCallback(
        async (promise: Promise<unknown>) => {
            try {
                await promise;
                listsSnapshotRef.current = null;
            } catch (err) {
                rollbackLists();
                toast.error(parseApiError(err));
            }
        },
        [rollbackLists]
    );

    // Board settings & members modals
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [membersOpen, setMembersOpen] = useState(false);
    const [archivedOpen, setArchivedOpen] = useState(false);
    const [boardSwitcherOpen, setBoardSwitcherOpen] = useState(false);
    const [selectMode, setSelectMode] = useState(false);
    const [selectedCardIds, setSelectedCardIds] = useState<Set<number>>(new Set());
    const [bulkTargetListId, setBulkTargetListId] = useState<number | "">("");

    const handleCloseCard = useCallback(() => setDetailCard(null), []);
    const handleCardUpdate = useCallback((updated: Card) => setDetailCard(updated), []);
    const handleCardDeleted = useCallback((deletedCardId: number) => {
        setLocalLists((prev) =>
            prev.map((l) => ({
                ...l,
                cards: l.cards.filter((c) => c.id !== deletedCardId),
            }))
        );
    }, []);

    const boardStats = statsData?.data;
    const bgColor = getBoardColor(board?.background, boardId);
    const boardTheme = getBoardTheme(bgColor);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 200, tolerance: 5 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Custom collision detection: prefer pointer-within for cards, else closest-corners
    const collisionDetection: CollisionDetection = (args) => {
        const pointerCollisions = pointerWithin(args);
        if (pointerCollisions.length > 0) return pointerCollisions;
        const rectCollisions = rectIntersection(args);
        if (rectCollisions.length > 0) return rectCollisions;
        return closestCorners(args);
    };

    const findListByCardId = (cardId: number): LocalList | undefined => {
        return localLists.find((l) => l.cards.some((c) => c.id === cardId));
    };

    const findListById = (listId: number): LocalList | undefined => {
        return localLists.find((l) => l.id === listId);
    };

    const parseDragId = (id: string): { type: "card" | "list" | "list-drop"; id: number } | null => {
        if (id.startsWith("card-")) return { type: "card", id: Number(id.replace("card-", "")) };
        if (id.startsWith("list-drop-")) return { type: "list-drop", id: Number(id.replace("list-drop-", "")) };
        if (id.startsWith("list-")) return { type: "list", id: Number(id.replace("list-", "")) };
        return null;
    };

    const handleDragStart = (event: DragStartEvent) => {
        if (!canEditBoard || selectMode) return;
        listsSnapshotRef.current = localLists.map((l) => ({
            ...l,
            cards: [...l.cards],
        }));
        const id = String(event.active.id);
        setActiveId(id);
        const parsed = parseDragId(id);
        if (!parsed) return;
        if (parsed.type === "card") {
            const sourceList = findListByCardId(parsed.id);
            const card = sourceList?.cards.find((c) => c.id === parsed.id);
            if (card && sourceList) {
                setActiveDragData({ type: "card", card, originalListId: sourceList.id });
            }
        } else if (parsed.type === "list") {
            const list = findListById(parsed.id);
            if (list) setActiveDragData({ type: "list", list });
        }
    };

    const handleDragOver = (event: DragOverEvent) => {
        if (!canEditBoard) return;
        const { active, over } = event;
        if (!over) return;
        const activeId = String(active.id);
        const overId = String(over.id);
        if (activeId === overId) return;

        const activeParsed = parseDragId(activeId);
        const overParsed = parseDragId(overId);
        if (!activeParsed || !overParsed) return;

        if (activeParsed.type !== "card") return;

        const activeCardId = activeParsed.id;
        const sourceList = findListByCardId(activeCardId);
        if (!sourceList) return;

        let targetListId: number | null = null;
        let targetIndex: number = -1;

        if (overParsed.type === "card") {
            const targetList = findListByCardId(overParsed.id);
            if (!targetList) return;
            targetListId = targetList.id;
            targetIndex = targetList.cards.findIndex((c) => c.id === overParsed.id);
        } else if (overParsed.type === "list-drop" || overParsed.type === "list") {
            targetListId = overParsed.id;
            const targetList = findListById(overParsed.id);
            targetIndex = targetList?.cards.length ?? 0;
        }

        if (targetListId === null) return;
        if (sourceList.id === targetListId) return; // same list - leave to sortable

        // Move card to target list visually
        setLocalLists((prev) => {
            const newLists = prev.map((l) => ({ ...l, cards: [...l.cards] }));
            const sourceIdx = newLists.findIndex((l) => l.id === sourceList.id);
            const targetIdx = newLists.findIndex((l) => l.id === targetListId);
            if (sourceIdx === -1 || targetIdx === -1) return prev;

            const cardIdx = newLists[sourceIdx].cards.findIndex((c) => c.id === activeCardId);
            if (cardIdx === -1) return prev;

            const [movedCard] = newLists[sourceIdx].cards.splice(cardIdx, 1);
            const insertIdx = targetIndex >= 0 ? targetIndex : newLists[targetIdx].cards.length;
            newLists[targetIdx].cards.splice(insertIdx, 0, movedCard);

            return newLists;
        });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        const dragData = activeDragData;
        setActiveId(null);
        setActiveDragData(null);

        if (!canEditBoard) {
            listsSnapshotRef.current = null;
            return;
        }
        if (!over) {
            rollbackLists();
            return;
        }
        const activeId = String(active.id);
        const overId = String(over.id);

        const activeParsed = parseDragId(activeId);
        const overParsed = parseDragId(overId);
        if (!activeParsed || !overParsed) return;

        // List reorder
        if (activeParsed.type === "list" && overParsed.type === "list") {
            if (activeParsed.id === overParsed.id) return;
            const oldIndex = localLists.findIndex((l) => l.id === activeParsed.id);
            const newIndex = localLists.findIndex((l) => l.id === overParsed.id);
            if (oldIndex === -1 || newIndex === -1) return;

            const newLists = arrayMove(localLists, oldIndex, newIndex);
            setLocalLists(newLists);
            persistWithRollback(
                reorderLists({
                    workspaceId, boardId,
                    orderedIds: newLists.map((l) => l.id),
                }).unwrap()
            );
            return;
        }

        // Card move
        if (activeParsed.type === "card") {
            const activeCardId = activeParsed.id;
            const currentList = findListByCardId(activeCardId);
            if (!currentList) return;

            const originalListId = dragData?.originalListId ?? currentList.id;

            // Same list reorder
            if (overParsed.type === "card") {
                const overList = findListByCardId(overParsed.id);
                if (!overList) return;

                if (overList.id === currentList.id && currentList.id === originalListId) {
                    const oldIndex = currentList.cards.findIndex((c) => c.id === activeCardId);
                    const newIndex = currentList.cards.findIndex((c) => c.id === overParsed.id);
                    if (oldIndex === newIndex) return;

                    const newCards = arrayMove(currentList.cards, oldIndex, newIndex);
                    setLocalLists((prev) =>
                        prev.map((l) =>
                            l.id === currentList.id ? { ...l, cards: newCards } : l
                        )
                    );
                    persistWithRollback(
                        reorderCards({
                            workspaceId, boardId, listId: currentList.id,
                            orderedIds: newCards.map((c) => c.id),
                        }).unwrap()
                    );
                    return;
                }
            }

            // Cross-list move: call moveCard API
            if (currentList.id !== originalListId) {
                const newIndex = currentList.cards.findIndex((c) => c.id === activeCardId);
                persistWithRollback(
                    moveCard({
                        workspaceId, boardId,
                        listId: originalListId,
                        cardId: activeCardId,
                        body: {
                            targetListId: currentList.id,
                            position: newIndex,
                        },
                    }).unwrap()
                );
                return;
            }

            // Same list reorder (dropped on list-drop area)
            const oldIndex = currentList.cards.findIndex((c) => c.id === activeCardId);
            const newIndex = currentList.cards.length - 1;
            if (oldIndex !== newIndex) {
                const newCards = arrayMove(currentList.cards, oldIndex, newIndex);
                setLocalLists((prev) =>
                    prev.map((l) =>
                        l.id === currentList.id ? { ...l, cards: newCards } : l
                    )
                );
                persistWithRollback(
                    reorderCards({
                        workspaceId, boardId, listId: currentList.id,
                        orderedIds: newCards.map((c) => c.id),
                    }).unwrap()
                );
            }
        }
    };

    const handleToggleStar = async () => {
        if (!board) return;
        try {
            await updateBoard({
                workspaceId, boardId,
                body: { isStarred: !board.isStarred },
            }).unwrap();
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handleCreateList = async () => {
        const name = newListName.trim();
        if (!name) return;
        try {
            await createList({ workspaceId, boardId, name }).unwrap();
            setNewListName("");
            setAddingList(false);
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const toggleCardSelect = (cardId: number) => {
        setSelectedCardIds((prev) => {
            const next = new Set(prev);
            if (next.has(cardId)) next.delete(cardId);
            else next.add(cardId);
            return next;
        });
    };

    const exitSelectMode = () => {
        setSelectMode(false);
        setSelectedCardIds(new Set());
        setBulkTargetListId("");
    };

    const handleBulkMove = async () => {
        if (!bulkTargetListId || selectedCardIds.size === 0) return;
        try {
            await bulkMoveCards({
                workspaceId,
                boardId,
                body: {
                    cardIds: [...selectedCardIds],
                    targetListId: Number(bulkTargetListId),
                },
            }).unwrap();
            toast.success(`Moved ${selectedCardIds.size} card(s)`);
            exitSelectMode();
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const getStatusCount = (status: string) =>
        boardStats?.byStatus?.find((s) => s.status === status)?.count ?? 0;

    const activeCard = useMemo(() => {
        if (!activeDragData || activeDragData.type !== "card") return null;
        return activeDragData.card ?? null;
    }, [activeDragData]);

    const activeList = useMemo(() => {
        if (!activeDragData || activeDragData.type !== "list") return null;
        return activeDragData.list ?? null;
    }, [activeDragData]);

    const isBoardInitialLoading =
        !sessionReady ||
        boardUninitialized ||
        boardLoading ||
        (boardFetching && !board);

    const showBoardError =
        sessionReady &&
        !boardUninitialized &&
        !boardLoading &&
        !boardFetching &&
        (boardIsError || !board);

    if (isBoardInitialLoading) {
        return <BoardPageSkeleton />;
    }

    if (showBoardError) {
        const errorMessage = boardIsError
            ? parseApiError(boardQueryError)
            : "This board doesn't exist or you don't have access.";

        return (
            <div className="min-h-dvh flex items-center justify-center bg-[#f0f2f5] p-6">
                <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
                    <EmptyState
                        icon={<LayoutGrid className="h-6 w-6" />}
                        title="Couldn't load this board"
                        description={errorMessage}
                        className="py-0"
                    />
                    <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => refetchBoard()}
                            className="w-full sm:w-auto"
                        >
                            Try again
                        </Button>
                        <Button
                            onClick={() => router.push(`/workspaces/${workspaceId}`)}
                            className="w-full sm:w-auto"
                        >
                            Back to workspace
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (!board) return null;

    return (
        <div
            className="flex flex-col min-h-0 h-dvh overflow-hidden"
            style={{ backgroundColor: bgColor, ...getBoardScrollbarStyle(bgColor) }}
        >
            {fromAdmin && <AdminReturnBanner href="/admin/boards" />}
            {isViewOnly && (
                <ViewOnlyBanner
                    variant="dark"
                    message="View-only mode — you can browse cards but cannot make changes."
                />
            )}

            {/* Board toolbar */}
            <div className="relative z-30 shrink-0 h-12 bg-black/30 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-2 sm:px-4 gap-2 shadow-sm">
                <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1">
                    <Link
                        href={`/workspaces/${workspaceId}`}
                        className="flex items-center justify-center h-7 w-7 rounded hover:bg-white/20 text-white/80 hover:text-white transition-colors shrink-0 cursor-pointer"
                        title="Back to workspace"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>

                    <button
                        type="button"
                        onClick={() => setBoardSwitcherOpen(true)}
                        className="flex items-center gap-1 min-w-0 group cursor-pointer"
                        title="Switch board"
                    >
                        <h1 className="text-sm font-bold text-white truncate">{board.name}</h1>
                        <ChevronDown className="h-3.5 w-3.5 text-white/70 shrink-0 group-hover:text-white" />
                    </button>

                    {board.visibility === "private" && (
                        <div className="hidden sm:flex items-center gap-1 bg-black/20 rounded px-2 py-1 shrink-0">
                            <Lock className="h-3 w-3 text-white/80" />
                            <span className="text-xs text-white/80">Private</span>
                        </div>
                    )}
                    {board.visibility === "public" && (
                        <div className="hidden sm:flex items-center gap-1 bg-black/20 rounded px-2 py-1 shrink-0">
                            <Globe className="h-3 w-3 text-white/80" />
                            <span className="text-xs text-white/80">Public</span>
                        </div>
                    )}

                    {canEditBoard && (
                        <button
                            onClick={handleToggleStar}
                            className="flex items-center justify-center h-7 w-7 rounded hover:bg-white/20 transition-colors shrink-0 cursor-pointer"
                            title={board.isStarred ? "Unstar" : "Star this board"}
                        >
                            <Star
                                className={cn(
                                    "h-4 w-4",
                                    board.isStarred ? "fill-amber-300 text-amber-300" : "text-white/70"
                                )}
                            />
                        </button>
                    )}

                    {boardStats && (
                        <BoardStatsChips
                            boardStats={boardStats}
                            getStatusCount={getStatusCount}
                            className="hidden xl:flex ml-2 shrink-0"
                        />
                    )}

                    {effectiveBoardRole && (
                        <div className="hidden lg:block shrink-0">
                            <RoleBadge
                                role={effectiveBoardRole}
                                scope="board"
                                className="!bg-white/20 !text-white/90 border border-white/20"
                            />
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    {viewingCount > 0 && (
                        <div
                            className="hidden md:flex items-center gap-1.5 mr-1 text-[11px] text-white/80"
                            title={viewingUsers.map((u) => u.name).join(", ")}
                        >
                            <div className="flex -space-x-1.5">
                                {viewingUsers.slice(0, 3).map((u) => (
                                    <Avatar
                                        key={u.id}
                                        src={u.avatar}
                                        name={u.name}
                                        size="xs"
                                        className="ring-2 ring-white/30"
                                    />
                                ))}
                            </div>
                            <span className="whitespace-nowrap">{viewingCount} viewing</span>
                        </div>
                    )}

                    {/* Member avatars stack */}
                    {boardMembers.length > 0 && (
                        <div className="hidden md:flex -space-x-2 mr-1">
                            {boardMembers.slice(0, 4).map((m) => (
                                <Avatar
                                    key={m.id}
                                    src={m.user.avatar}
                                    name={m.user.name}
                                    size="sm"
                                    className="ring-2 ring-white/30"
                                    title={m.user.name}
                                />
                            ))}
                            {boardMembers.length > 4 && (
                                <div className="h-7 w-7 rounded-full bg-slate-700 flex items-center justify-center text-white text-[10px] font-bold border-2 border-white/30">
                                    +{boardMembers.length - 4}
                                </div>
                            )}
                        </div>
                    )}

                    <BoardSearchBar
                        workspaceId={workspaceId}
                        boardId={boardId}
                        onSelectCard={setDetailCard}
                    />

                    <button
                        onClick={() => setMembersOpen(true)}
                        className="hidden sm:flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium px-3 py-1.5 rounded transition-colors cursor-pointer"
                    >
                        <Users className="h-3.5 w-3.5" />
                        {canManageBoard ? "Share" : "Members"}
                    </button>
                    <button
                        onClick={() => setMembersOpen(true)}
                        className="sm:hidden flex items-center justify-center h-7 w-7 rounded bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                        aria-label="Members"
                    >
                        <Users className="h-3.5 w-3.5" />
                    </button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="flex items-center justify-center h-7 w-7 rounded bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer outline-none"
                                aria-label="More options"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[200px]">
                            {canManageBoard && (
                                <DropdownMenuItem onSelect={() => setSettingsOpen(true)}>
                                    <Pencil className="h-3.5 w-3.5" />
                                    Edit board
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onSelect={() => setMembersOpen(true)}>
                                <Users className="h-3.5 w-3.5" />
                                {canManageBoard ? "Manage members" : "View members"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setArchivedOpen(true)}>
                                <Archive className="h-3.5 w-3.5" />
                                Archived items
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setBoardSwitcherOpen(true)}>
                                <ChevronDown className="h-3.5 w-3.5" />
                                Switch board
                            </DropdownMenuItem>
                            {canEditBoard && (
                                <DropdownMenuItem onSelect={() => setSelectMode(true)}>
                                    <CheckSquare className="h-3.5 w-3.5" />
                                    Select cards
                                </DropdownMenuItem>
                            )}
                            {canEditBoard && (
                                <DropdownMenuItem onSelect={handleToggleStar}>
                                    <Star className={cn("h-3.5 w-3.5", board?.isStarred && "fill-amber-400 text-amber-400")} />
                                    {board?.isStarred ? "Remove from starred" : "Add to starred"}
                                </DropdownMenuItem>
                            )}
                            {canManageBoard && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onSelect={() => setSettingsOpen(true)}>
                                        <Settings className="h-3.5 w-3.5" />
                                        Board settings
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {boardStats && (
                <BoardStatsChips
                    boardStats={boardStats}
                    getStatusCount={getStatusCount}
                    className="xl:hidden shrink-0 px-3 py-1.5 bg-black/20 overflow-x-auto"
                />
            )}

            {/* DnD lists area — scrollbar flush to bottom; content padding clears floating nav */}
            <div className="flex-1 min-h-0 flex flex-col">
            <DndContext
                sensors={sensors}
                collisionDetection={collisionDetection}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div
                    className={cn("flex-1 min-h-0", BOARD_SCROLLBAR_X_CLASS)}
                    style={getBoardScrollbarStyle(bgColor)}
                >
                    <div
                        className="flex gap-3 p-3 sm:p-4 items-start w-max min-w-full"
                        style={{ paddingBottom: `calc(${BOARD_BOTTOM_NAV_HEIGHT} + 0.5rem)` }}
                    >
                        {listsLoading ? (
                            <>
                                {[1, 2, 3].map((i) => (
                                    <Skeleton
                                        key={i}
                                        className="h-40 w-72 rounded-xl bg-white/20 shrink-0"
                                    />
                                ))}
                            </>
                        ) : (
                            <>
                                <SortableContext
                                    items={localLists.map((l) => `list-${l.id}`)}
                                    strategy={horizontalListSortingStrategy}
                                >
                                    {localLists.map((list) => (
                                        <ListColumn
                                            key={list.id}
                                            list={list}
                                            workspaceId={workspaceId}
                                            boardId={boardId}
                                            boardColor={bgColor}
                                            onCardClick={setDetailCard}
                                            readOnly={!canEditBoard || selectMode}
                                            selectMode={selectMode}
                                            selectedCardIds={selectedCardIds}
                                            onToggleCardSelect={toggleCardSelect}
                                        />
                                    ))}
                                </SortableContext>

                                {/* Add list */}
                                {canEditBoard && (addingList ? (
                                    <div className={cn("w-72 shrink-0 self-start rounded-xl p-2 space-y-2", boardTheme.addListColumn)}>
                                        <input
                                            autoFocus
                                            value={newListName}
                                            onChange={(e) => setNewListName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") handleCreateList();
                                                if (e.key === "Escape") {
                                                    setAddingList(false);
                                                    setNewListName("");
                                                }
                                            }}
                                            placeholder="Enter list title…"
                                            className="w-full text-sm font-semibold text-[#172b4d] bg-white border-0 rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={handleCreateList}
                                                disabled={!newListName.trim() || creatingList}
                                                className="inline-flex items-center text-sm font-medium text-white bg-[#0c66e4] hover:bg-[#0055cc] disabled:opacity-50 rounded-lg px-3 py-1.5 cursor-pointer"
                                            >
                                                {creatingList ? "Adding…" : "Add list"}
                                            </button>
                                            <button
                                                onClick={() => { setAddingList(false); setNewListName(""); }}
                                                className="flex items-center justify-center h-8 w-8 rounded hover:bg-white/15 text-white/70 transition-colors cursor-pointer"
                                                aria-label="Cancel"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setAddingList(true)}
                                        className={cn(
                                            "w-72 shrink-0 self-start flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors backdrop-blur-sm cursor-pointer",
                                            boardTheme.addListBtn
                                        )}
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add another list
                                    </button>
                                ))}
                            </>
                        )}
                    </div>
                </div>

                {/* Drag overlay */}
                <DragOverlay dropAnimation={null}>
                    {activeCard && (
                        <div className={cn("rounded-lg shadow-2xl overflow-hidden rotate-3 opacity-95 w-72", boardTheme.card)}>
                            <CardContent card={activeCard} theme={boardTheme} />
                        </div>
                    )}
                    {activeList && (
                        <div className={cn("w-72 rounded-xl p-2 shadow-2xl rotate-2 opacity-95", boardTheme.listColumn)}>
                            <div className={cn("text-sm font-semibold px-2 py-1", boardTheme.listHeader)}>
                                {activeList.name}
                            </div>
                            <div className={cn("text-xs px-2", boardTheme.listCount)}>
                                {activeList.cards.length} cards
                            </div>
                        </div>
                    )}
                </DragOverlay>
            </DndContext>
            </div>

            {selectMode && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex flex-wrap items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl max-w-[95vw] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                    <span className="text-sm font-medium">{selectedCardIds.size} selected</span>
                    <select
                        value={bulkTargetListId}
                        onChange={(e) => setBulkTargetListId(e.target.value ? Number(e.target.value) : "")}
                        className="text-sm bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-white cursor-pointer"
                    >
                        <option value="">Move to list…</option>
                        {localLists.map((list) => (
                            <option key={list.id} value={list.id}>{list.name}</option>
                        ))}
                    </select>
                    <Button
                        size="sm"
                        loading={bulkMoving}
                        disabled={!bulkTargetListId || selectedCardIds.size === 0}
                        onClick={handleBulkMove}
                    >
                        Move cards
                    </Button>
                    <button
                        onClick={exitSelectMode}
                        className="text-sm text-slate-300 hover:text-white px-2 cursor-pointer"
                    >
                        Cancel
                    </button>
                </div>
            )}

            {/* Card detail modal */}
            <CardDetailModal
                open={!!detailCard}
                onClose={handleCloseCard}
                workspaceId={workspaceId}
                boardId={boardId}
                boardColor={bgColor}
                card={detailCard}
                lists={localLists.map((l) => ({ id: l.id, name: l.name }))}
                readOnly={!canEditBoard}
                onCardUpdate={handleCardUpdate}
                onCardDeleted={handleCardDeleted}
            />

            {/* Board settings modal */}
            {board && (
                <BoardSettingsModal
                    open={settingsOpen}
                    onClose={() => setSettingsOpen(false)}
                    workspaceId={workspaceId}
                    board={board}
                    canDelete={canDeleteBoard}
                />
            )}

            {/* Board members modal */}
            <BoardMembersModal
                open={membersOpen}
                onClose={() => setMembersOpen(false)}
                workspaceId={workspaceId}
                boardId={boardId}
                canManage={canManageBoard}
                currentUserId={currentUser?.id}
            />

            <ArchivedItemsPanel
                open={archivedOpen}
                onClose={() => setArchivedOpen(false)}
                workspaceId={workspaceId}
                boardId={boardId}
                canRestore={canEditBoard}
                canDelete={canEditBoard}
            />

            <BoardSwitcherSheet
                open={boardSwitcherOpen}
                onClose={() => setBoardSwitcherOpen(false)}
                workspaceId={workspaceId}
                currentBoardId={boardId}
                boardColor={bgColor}
                workspaceName={workspace?.name}
            />

            <BoardBottomNav
                workspaceId={workspaceId}
                boardId={boardId}
                boardName={board.name}
                boardColor={bgColor}
                workspaceName={workspace?.name}
                unreadCount={unreadCount}
                canEditBoard={canEditBoard}
                canManageBoard={canManageBoard}
                profileHref={profileHref}
                hidden={!!detailCard}
                onSwitchBoard={() => setBoardSwitcherOpen(true)}
                onAddList={() => setAddingList(true)}
                onOpenMembers={() => setMembersOpen(true)}
                onOpenSettings={() => setSettingsOpen(true)}
                onOpenArchived={() => setArchivedOpen(true)}
            />
        </div>
    );
}

function BoardStatsChips({
    boardStats,
    getStatusCount,
    className,
}: {
    boardStats: CardStats;
    getStatusCount: (status: string) => number;
    className?: string;
}) {
    return (
        <div className={cn("flex items-center gap-2 text-[11px] text-white/80", className)}>
            <span className="bg-black/20 rounded px-2 py-0.5 whitespace-nowrap">{boardStats.total} cards</span>
            <span className="bg-black/20 rounded px-2 py-0.5 whitespace-nowrap">{getStatusCount("open")} open</span>
            <span className="bg-black/20 rounded px-2 py-0.5 whitespace-nowrap">{getStatusCount("in_progress")} active</span>
            <span className="bg-black/20 rounded px-2 py-0.5 whitespace-nowrap">{getStatusCount("in_review")} review</span>
            <span className="bg-black/20 rounded px-2 py-0.5 whitespace-nowrap">{getStatusCount("done")} done</span>
            {boardStats.doneThisWeek > 0 && (
                <span className="bg-emerald-500/30 rounded px-2 py-0.5 whitespace-nowrap">
                    {boardStats.doneThisWeek} this week
                </span>
            )}
            {boardStats.overdue > 0 && (
                <span className="bg-red-500/40 rounded px-2 py-0.5 whitespace-nowrap">{boardStats.overdue} overdue</span>
            )}
        </div>
    );
}
