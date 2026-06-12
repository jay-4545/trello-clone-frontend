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
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui";
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
import {
    useGetBoardDetailQuery,
    useUpdateBoardMutation,
    useGetBoardMembersQuery,
} from "@/lib/api/boardApi";
import { useGetWorkspaceQuery } from "@/lib/api/workspaceApi";
import { useGetProfileQuery } from "@/lib/api/authApi";
import {
    useGetListsQuery,
    useCreateListMutation,
    useReorderListsMutation,
} from "@/lib/api/listApi";
import {
    useMoveCardMutation,
    useReorderCardsMutation,
} from "@/lib/api/cardApi";
import type { Card } from "@/types/card.types";
import { parseApiError } from "@/utils/errorParser";
import { cn } from "@/utils/cn";
import { useBoardSocket } from "@/lib/socket/useBoardSocket";
import { useBoardPermissions } from "@/hooks/usePermissions";

interface LocalList {
    id: number;
    name: string;
    position: number;
    cards: Card[];
}

const BOARD_FALLBACK_COLORS = [
    "#0079BF", "#4BBC4E", "#FF9F1A", "#EB5A46",
    "#C377E0", "#FF78CB", "#00C2E0", "#0052CC",
];

export default function BoardDetailPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const workspaceId = Number(params.id);
    const boardId = Number(params.boardId);

    useBoardSocket(boardId);

    const { data: boardData, isLoading: boardLoading } = useGetBoardDetailQuery({ workspaceId, boardId });
    const { data: listsData, isLoading: listsLoading } = useGetListsQuery({ workspaceId, boardId });
    const { data: wsData } = useGetWorkspaceQuery(workspaceId);
    const { data: profileData } = useGetProfileQuery();
    const { data: boardMembersData } = useGetBoardMembersQuery({ workspaceId, boardId });
    const [updateBoard] = useUpdateBoardMutation();
    const [createList, { isLoading: creatingList }] = useCreateListMutation();
    const [reorderLists] = useReorderListsMutation();
    const [moveCard] = useMoveCardMutation();
    const [reorderCards] = useReorderCardsMutation();

    const fromAdmin = searchParams.get("from") === "admin";
    const board = boardData?.data;
    const serverLists = listsData?.data;
    const workspace = wsData?.data;
    const currentUser = profileData?.data;
    const boardMembers = boardMembersData?.data ?? [];

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
    const [moreMenuOpen, setMoreMenuOpen] = useState(false);
    const [archivedOpen, setArchivedOpen] = useState(false);

    const bgColor = board?.background ?? BOARD_FALLBACK_COLORS[boardId % BOARD_FALLBACK_COLORS.length];

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
        if (!canEditBoard) return;
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

    const activeCard = useMemo(() => {
        if (!activeDragData || activeDragData.type !== "card") return null;
        return activeDragData.card ?? null;
    }, [activeDragData]);

    const activeList = useMemo(() => {
        if (!activeDragData || activeDragData.type !== "list") return null;
        return activeDragData.list ?? null;
    }, [activeDragData]);

    if (boardLoading) {
        return (
            <div className="h-full flex flex-col" style={{ backgroundColor: "#0079BF" }}>
                <div className="h-12 bg-black/20 flex items-center px-4 gap-4">
                    <Skeleton className="h-5 w-32 bg-white/20" />
                </div>
                <div className="flex-1 flex gap-3 p-4 overflow-x-auto">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-40 w-72 rounded-xl bg-white/20 shrink-0" />
                    ))}
                </div>
            </div>
        );
    }

    if (!board) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-100 p-4">
                <div className="text-center">
                    <p className="text-slate-600 mb-4">Board not found or you don&apos;t have access.</p>
                    <Button onClick={() => router.push(`/workspaces/${workspaceId}`)}>
                        Back to workspace
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div
            className="h-full flex flex-col overflow-hidden"
            style={{ backgroundColor: bgColor }}
        >
            {fromAdmin && <AdminReturnBanner href="/admin/boards" />}
            {isViewOnly && (
                <ViewOnlyBanner
                    variant="dark"
                    message="View-only mode — you can browse cards but cannot make changes."
                />
            )}

            {/* Board toolbar */}
            <div className="relative z-30 shrink-0 h-12 bg-black/25 backdrop-blur-sm flex items-center justify-between px-2 sm:px-4 gap-2">
                <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1">
                    <Link
                        href={`/workspaces/${workspaceId}`}
                        className="flex items-center justify-center h-7 w-7 rounded hover:bg-white/20 text-white/80 hover:text-white transition-colors shrink-0"
                        title="Back to workspace"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>

                    <h1 className="text-sm font-bold text-white truncate">{board.name}</h1>

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
                            className="flex items-center justify-center h-7 w-7 rounded hover:bg-white/20 transition-colors shrink-0"
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
                    {/* Member avatars stack */}
                    {boardMembers.length > 0 && (
                        <div className="hidden md:flex -space-x-2 mr-1">
                            {boardMembers.slice(0, 4).map((m) => (
                                <div
                                    key={m.id}
                                    className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold border-2 border-white/30"
                                    title={m.user.name}
                                >
                                    {m.user.name[0].toUpperCase()}
                                </div>
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
                        className="hidden sm:flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium px-3 py-1.5 rounded transition-colors"
                    >
                        <Users className="h-3.5 w-3.5" />
                        {canManageBoard ? "Share" : "Members"}
                    </button>
                    <button
                        onClick={() => setMembersOpen(true)}
                        className="sm:hidden flex items-center justify-center h-7 w-7 rounded bg-white/20 hover:bg-white/30 text-white transition-colors"
                        aria-label="Members"
                    >
                        <Users className="h-3.5 w-3.5" />
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setMoreMenuOpen((v) => !v)}
                            className="flex items-center justify-center h-7 w-7 rounded bg-white/20 hover:bg-white/30 text-white transition-colors"
                            aria-label="More options"
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {moreMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setMoreMenuOpen(false)} />
                                <div className="absolute right-0 top-9 z-50 bg-white border border-slate-200 rounded-lg shadow-xl py-1 min-w-[200px] animate-in fade-in-0 slide-in-from-top-2 duration-150">
                                    {canManageBoard && (
                                        <button
                                            onClick={() => { setSettingsOpen(true); setMoreMenuOpen(false); }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                            Edit board
                                        </button>
                                    )}
                                    <button
                                        onClick={() => { setMembersOpen(true); setMoreMenuOpen(false); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                    >
                                        <Users className="h-3.5 w-3.5" />
                                        {canManageBoard ? "Manage members" : "View members"}
                                    </button>
                                    <button
                                        onClick={() => { setArchivedOpen(true); setMoreMenuOpen(false); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                    >
                                        <Archive className="h-3.5 w-3.5" />
                                        Archived items
                                    </button>
                                    {canEditBoard && (
                                        <button
                                            onClick={handleToggleStar}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                        >
                                            <Star className={cn("h-3.5 w-3.5", board?.isStarred && "fill-amber-400 text-amber-400")} />
                                            {board?.isStarred ? "Remove from starred" : "Add to starred"}
                                        </button>
                                    )}
                                    {canManageBoard && (
                                        <>
                                            <div className="my-1 border-t border-slate-100" />
                                            <button
                                                onClick={() => { setSettingsOpen(true); setMoreMenuOpen(false); }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                            >
                                                <Settings className="h-3.5 w-3.5" />
                                                Board settings
                                            </button>
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* DnD lists area */}
            <DndContext
                sensors={sensors}
                collisionDetection={collisionDetection}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="flex-1 overflow-x-auto overflow-y-hidden">
                    <div className="flex gap-3 p-3 sm:p-4 h-full items-start">
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
                                            onCardClick={setDetailCard}
                                            readOnly={!canEditBoard}
                                        />
                                    ))}
                                </SortableContext>

                                {/* Add list */}
                                {canEditBoard && (addingList ? (
                                    <div className="w-72 shrink-0 bg-slate-100/95 backdrop-blur-sm rounded-xl p-2 space-y-2">
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
                                            className="w-full text-sm font-semibold text-slate-900 bg-white border border-blue-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                onClick={handleCreateList}
                                                loading={creatingList}
                                                disabled={!newListName.trim()}
                                            >
                                                Add list
                                            </Button>
                                            <button
                                                onClick={() => { setAddingList(false); setNewListName(""); }}
                                                className="flex items-center justify-center h-8 w-8 rounded hover:bg-slate-200 text-slate-500 transition-colors"
                                                aria-label="Cancel"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setAddingList(true)}
                                        className="w-72 shrink-0 flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white rounded-xl px-4 py-3 text-sm font-medium transition-colors backdrop-blur-sm"
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
                        <div className="bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden rotate-3 opacity-95 w-72">
                            <CardContent card={activeCard} />
                        </div>
                    )}
                    {activeList && (
                        <div className="w-72 bg-slate-100 rounded-xl p-2 shadow-2xl rotate-2 opacity-95">
                            <div className="text-sm font-semibold text-slate-800 px-2 py-1">
                                {activeList.name}
                            </div>
                            <div className="text-xs text-slate-500 px-2">
                                {activeList.cards.length} cards
                            </div>
                        </div>
                    )}
                </DragOverlay>
            </DndContext>

            {/* Card detail modal */}
            <CardDetailModal
                open={!!detailCard}
                onClose={() => setDetailCard(null)}
                workspaceId={workspaceId}
                boardId={boardId}
                card={detailCard}
                readOnly={!canEditBoard}
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
            />
        </div>
    );
}
