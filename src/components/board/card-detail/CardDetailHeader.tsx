"use client";
import { Check } from "lucide-react";
import CardMetaBar from "@/components/board/CardMetaBar";
import type { Card } from "@/types/card.types";
import type { CardDetailActions } from "./useCardDetailActions";
import { cn } from "@/utils/cn";

interface Props {
    card: Card;
    commentCount: number;
    readOnly: boolean;
    onEditPriority?: () => void;
    actions: CardDetailActions;
}

export default function CardDetailHeader({
    card,
    commentCount,
    readOnly,
    onEditPriority,
    actions,
}: Props) {
    const {
        editingTitle,
        setEditingTitle,
        titleValue,
        setTitleValue,
        handleSaveTitle,
        handleToggleComplete,
        savingField,
    } = actions;

    const isDone = card.status === "done";
    const isSavingTitle = savingField === "title";

    return (
        <div className="mb-4 space-y-4">
            <div className="flex items-start gap-3">
                <button
                    type="button"
                    onClick={() => !readOnly && handleToggleComplete()}
                    disabled={readOnly}
                    className={cn(
                        "mt-2 h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0",
                        "transition-all duration-150 active:scale-95",
                        isDone ? "bg-green-500 border-green-500" : "border-slate-400 hover:border-slate-600",
                        !readOnly && "cursor-pointer"
                    )}
                    aria-label={isDone ? "Mark as open" : "Mark as done"}
                >
                    {isDone && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                </button>

                <div className="flex-1 min-w-0">
                    {editingTitle && !readOnly ? (
                        <textarea
                            autoFocus
                            value={titleValue}
                            onChange={(e) => setTitleValue(e.target.value)}
                            onBlur={handleSaveTitle}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSaveTitle();
                                }
                                if (e.key === "Escape") {
                                    setTitleValue(card.title);
                                    setEditingTitle(false);
                                }
                            }}
                            rows={2}
                            disabled={isSavingTitle}
                            className={cn(
                                "w-full text-xl sm:text-2xl font-semibold text-[#172b4d]",
                                "bg-white border border-slate-300 rounded-lg px-3 py-2",
                                "focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none",
                                "animate-in fade-in-0 duration-150"
                            )}
                        />
                    ) : (
                        <h2
                            onClick={() => !readOnly && setEditingTitle(true)}
                            className={cn(
                                "text-xl sm:text-2xl font-semibold text-[#172b4d] leading-snug rounded px-1 -mx-1",
                                "transition-colors duration-150",
                                isDone && "line-through text-slate-500",
                                !readOnly && "cursor-pointer hover:bg-slate-100"
                            )}
                        >
                            {card.title}
                        </h2>
                    )}
                </div>
            </div>

            <CardMetaBar
                card={card}
                variant="detail"
                commentCount={commentCount}
                onPriorityClick={!readOnly ? onEditPriority : undefined}
            />
        </div>
    );
}
