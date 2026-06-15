"use client";
import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Plus, MoreHorizontal, X, GripVertical, Archive, Pencil, Settings } from "lucide-react";
import { toast } from "sonner";

import CardItem from "./CardItem";
import CreateCardModal from "./CreateCardModal";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Card } from "@/types/card.types";
import type { BoardTheme } from "@/lib/boardTheme";
import { getBoardTheme } from "@/lib/boardTheme";
import { useCreateCardMutation } from "@/lib/api/cardApi";
import { useArchiveListMutation, useUpdateListMutation } from "@/lib/api/listApi";
import { parseApiError } from "@/utils/errorParser";
import { cn } from "@/utils/cn";

interface LocalList {
    id: number;
    name: string;
    position: number;
    cards: Card[];
}

interface Props {
    list: LocalList;
    workspaceId: number;
    boardId: number;
    boardColor: string;
    onCardClick: (card: Card) => void;
    readOnly?: boolean;
    selectMode?: boolean;
    selectedCardIds?: Set<number>;
    onToggleCardSelect?: (cardId: number) => void;
}

export default function ListColumn({
    list,
    workspaceId,
    boardId,
    boardColor,
    onCardClick,
    readOnly = false,
    selectMode = false,
    selectedCardIds,
    onToggleCardSelect,
}: Props) {
    const theme = getBoardTheme(boardColor);

    const [editingName, setEditingName] = useState(false);
    const [nameValue, setNameValue] = useState(list.name);
    const [addingCard, setAddingCard] = useState(false);
    const [cardTitle, setCardTitle] = useState("");
    const [detailedCreateOpen, setDetailedCreateOpen] = useState(false);

    const [createCard, { isLoading: creatingCard }] = useCreateCardMutation();
    const [updateList] = useUpdateListMutation();
    const [archiveList] = useArchiveListMutation();

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: `list-${list.id}`,
        data: { type: "list", list },
        disabled: readOnly,
    });

    const { setNodeRef: setDroppableRef } = useDroppable({
        id: `list-drop-${list.id}`,
        data: { type: "list", listId: list.id },
    });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    const menuContentClass = theme.isDarkCanvas
        ? "bg-[#282e33] border-white/10 text-[#c9d1d9] [&_[data-highlighted]]:bg-white/10"
        : undefined;

    const handleCreateCard = async () => {
        const title = cardTitle.trim();
        if (!title) return;
        try {
            await createCard({
                workspaceId,
                boardId,
                listId: list.id,
                body: { title },
            }).unwrap();
            setCardTitle("");
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handleRename = async () => {
        const name = nameValue.trim();
        if (!name || name === list.name) {
            setEditingName(false);
            setNameValue(list.name);
            return;
        }
        try {
            await updateList({ workspaceId, boardId, listId: list.id, name }).unwrap();
            setEditingName(false);
        } catch (err) {
            toast.error(parseApiError(err));
            setNameValue(list.name);
            setEditingName(false);
        }
    };

    const handleArchive = async () => {
        if (!confirm(`Archive list "${list.name}"?`)) return;
        try {
            await archiveList({ workspaceId, boardId, listId: list.id }).unwrap();
            toast.success("List archived");
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    return (
        <>
        <div
            ref={setNodeRef}
            style={style}
            className={cn("w-72 shrink-0 self-start max-h-[calc(100dvh-10rem)] rounded-xl flex flex-col ring-1 ring-black/[0.06]", theme.listColumn)}
        >
            {/* List header */}
            <div className="flex items-center gap-1 px-2 py-2.5 shrink-0">
                {!readOnly && (
                    <button
                        {...attributes}
                        {...listeners}
                        className={cn(
                            "flex items-center justify-center h-6 w-5 cursor-grab active:cursor-grabbing touch-none",
                            theme.isDarkCanvas ? "text-white/40 hover:text-white/70" : "text-slate-300 hover:text-slate-500"
                        )}
                        aria-label="Drag list"
                    >
                        <GripVertical className="h-4 w-4" />
                    </button>
                )}

                {editingName && !readOnly ? (
                    <input
                        autoFocus
                        value={nameValue}
                        onChange={(e) => setNameValue(e.target.value)}
                        onBlur={handleRename}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleRename();
                            if (e.key === "Escape") {
                                setNameValue(list.name);
                                setEditingName(false);
                            }
                        }}
                        className={cn(
                            "flex-1 text-sm font-semibold rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500",
                            theme.isDarkCanvas
                                ? "text-white bg-white/10 border border-white/30"
                                : "text-slate-800 bg-white border border-blue-300"
                        )}
                    />
                ) : (
                    <button
                        onClick={() => !readOnly && setEditingName(true)}
                        className={cn(
                            "flex-1 text-left text-sm font-semibold rounded px-2 py-1 truncate cursor-pointer",
                            theme.listHeader,
                            !readOnly && (theme.isDarkCanvas ? "hover:bg-white/10" : "hover:bg-black/5")
                        )}
                    >
                        {list.name}
                    </button>
                )}

                <span className={cn("text-xs px-1.5", theme.listCount)}>{list.cards.length}</span>

                {!readOnly && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className={cn(
                                    "flex items-center justify-center h-7 w-7 rounded transition-colors cursor-pointer outline-none",
                                    theme.listMenuBtn
                                )}
                                aria-label="List options"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className={menuContentClass}>
                            <DropdownMenuItem onSelect={() => setEditingName(true)}>
                                <Pencil className="h-3.5 w-3.5" />
                                Rename list
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setAddingCard(true)}>
                                <Plus className="h-3.5 w-3.5" />
                                Add card
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setDetailedCreateOpen(true)}>
                                <Settings className="h-3.5 w-3.5" />
                                Add card with details…
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onSelect={handleArchive}
                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                                <Archive className="h-3.5 w-3.5" />
                                Archive list
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            {/* Cards area */}
            <div
                ref={setDroppableRef}
                className="flex-1 overflow-y-auto px-2 pb-1 space-y-2 min-h-0"
            >
                <SortableContext
                    items={list.cards.map((c) => `card-${c.id}`)}
                    strategy={verticalListSortingStrategy}
                >
                    {list.cards.map((card) => (
                        <CardItem
                            key={card.id}
                            card={card}
                            theme={theme}
                            onClick={() => onCardClick(card)}
                            readOnly={readOnly}
                            selectMode={selectMode}
                            selected={selectedCardIds?.has(card.id)}
                            onToggleSelect={() => onToggleCardSelect?.(card.id)}
                        />
                    ))}
                </SortableContext>

                {list.cards.length === 0 && !addingCard && (
                    <div className={cn("h-10 border border-dashed rounded-lg flex items-center justify-center", theme.dropZone)}>
                        <span className="text-[11px]">Drop cards here</span>
                    </div>
                )}
            </div>

            {/* Add card */}
            {!readOnly && (
                <div className="px-2 pb-2 pt-0.5 shrink-0">
                    {addingCard ? (
                        <div className="space-y-2">
                            <textarea
                                autoFocus
                                value={cardTitle}
                                onChange={(e) => setCardTitle(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleCreateCard();
                                    }
                                    if (e.key === "Escape") {
                                        setAddingCard(false);
                                        setCardTitle("");
                                    }
                                }}
                                placeholder="Enter a title for this card…"
                                rows={3}
                                className="w-full text-sm text-[#172b4d] bg-white border-0 rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder:text-slate-400"
                            />
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleCreateCard}
                                    disabled={!cardTitle.trim() || creatingCard}
                                    className="inline-flex items-center justify-center text-sm font-medium text-white bg-[#0c66e4] hover:bg-[#0055cc] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg px-3 py-1.5 transition-colors cursor-pointer"
                                >
                                    {creatingCard ? "Adding…" : "Add card"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setAddingCard(false); setCardTitle(""); }}
                                    className={cn(
                                        "flex items-center justify-center h-8 w-8 rounded transition-colors cursor-pointer",
                                        theme.listMenuBtn
                                    )}
                                    aria-label="Cancel"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setAddingCard(true)}
                            className={cn(
                                "w-full flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium transition-colors cursor-pointer",
                                theme.listAddBtn
                            )}
                        >
                            <Plus className="h-4 w-4" />
                            Add a card
                        </button>
                    )}
                </div>
            )}
        </div>

        <CreateCardModal
            open={detailedCreateOpen}
            onClose={() => setDetailedCreateOpen(false)}
            workspaceId={workspaceId}
            boardId={boardId}
            listId={list.id}
            listName={list.name}
        />
        </>
    );
}
