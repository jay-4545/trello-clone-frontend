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
import Button from "@/components/ui/Button";
import type { Card } from "@/types/card.types";
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
    onCardClick: (card: Card) => void;
    readOnly?: boolean;
}

export default function ListColumn({ list, workspaceId, boardId, onCardClick, readOnly = false }: Props) {
    const [menuOpen, setMenuOpen] = useState(false);
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
            // Keep the form open so user can add multiple cards
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
        setMenuOpen(false);
    };

    return (
        <>
        <div
            ref={setNodeRef}
            style={style}
            className="w-72 shrink-0 bg-slate-100/95 backdrop-blur-sm rounded-xl flex flex-col max-h-full shadow-sm"
        >
            {/* List header */}
            <div className="flex items-center gap-1 px-2 py-2 shrink-0">
                {!readOnly && (
                    <button
                        {...attributes}
                        {...listeners}
                        className="flex items-center justify-center h-6 w-5 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing touch-none"
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
                        className="flex-1 text-sm font-semibold text-slate-800 bg-white border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                ) : (
                    <button
                        onClick={() => !readOnly && setEditingName(true)}
                        className={cn(
                            "flex-1 text-left text-sm font-semibold text-slate-800 rounded px-2 py-1 truncate",
                            !readOnly && "hover:bg-slate-200/60"
                        )}
                    >
                        {list.name}
                    </button>
                )}

                <span className="text-xs text-slate-400 px-1.5">{list.cards.length}</span>

                {!readOnly && <div className="relative">
                    <button
                        onClick={() => setMenuOpen((v) => !v)}
                        className="flex items-center justify-center h-7 w-7 rounded hover:bg-slate-200 text-slate-500 transition-colors"
                        aria-label="List options"
                    >
                        <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {menuOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                            <div className="absolute right-0 top-8 z-20 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[160px]">
                                <button
                                    onClick={() => { setEditingName(true); setMenuOpen(false); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                    Rename
                                </button>
                                <button
                                    onClick={() => { setAddingCard(true); setMenuOpen(false); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add card
                                </button>
                                <button
                                    onClick={() => { setDetailedCreateOpen(true); setMenuOpen(false); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                >
                                    <Settings className="h-3.5 w-3.5" />
                                    Add card with details…
                                </button>
                                <button
                                    onClick={handleArchive}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                    <Archive className="h-3.5 w-3.5" />
                                    Archive list
                                </button>
                            </div>
                        </>
                    )}
                </div>}
            </div>

            {/* Cards area */}
            <div
                ref={setDroppableRef}
                className="flex-1 overflow-y-auto px-2 pb-1 space-y-2 min-h-[20px]"
            >
                <SortableContext
                    items={list.cards.map((c) => `card-${c.id}`)}
                    strategy={verticalListSortingStrategy}
                >
                    {list.cards.map((card) => (
                        <CardItem
                            key={card.id}
                            card={card}
                            onClick={() => onCardClick(card)}
                            readOnly={readOnly}
                        />
                    ))}
                </SortableContext>

                {list.cards.length === 0 && !addingCard && (
                    <div className="h-12 border-2 border-dashed border-slate-300/50 rounded-lg flex items-center justify-center">
                        <span className="text-[11px] text-slate-400">Drop cards here</span>
                    </div>
                )}
            </div>

            {/* Add card */}
            {!readOnly && <div className="px-2 pb-2 pt-1 shrink-0">
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
                            rows={2}
                            className="w-full text-sm text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder:text-slate-400"
                        />
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                onClick={handleCreateCard}
                                loading={creatingCard}
                                disabled={!cardTitle.trim()}
                            >
                                Add card
                            </Button>
                            <button
                                type="button"
                                onClick={() => {
                                    setAddingCard(false);
                                    setCardTitle("");
                                    setDetailedCreateOpen(true);
                                }}
                                className="text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded px-2 py-1.5"
                                title="Add with details"
                            >
                                <Settings className="h-3.5 w-3.5" />
                            </button>
                            <button
                                onClick={() => { setAddingCard(false); setCardTitle(""); }}
                                className="flex items-center justify-center h-8 w-8 rounded hover:bg-slate-200 text-slate-500 transition-colors"
                                aria-label="Cancel"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setAddingCard(true)}
                        className="w-full flex items-center gap-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg px-2 py-2 text-xs font-medium transition-colors"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Add a card
                    </button>
                )}
            </div>}
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
