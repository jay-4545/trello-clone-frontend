"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    Clock,
    CheckSquare,
    Paperclip,
    Eye,
} from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import type { Card } from "@/types/card.types";
import type { BoardTheme } from "@/lib/boardTheme";
import { cn } from "@/utils/cn";
import Avatar from "@/components/ui/Avatar";

const LABEL_COLORS = [
    "bg-emerald-500", "bg-blue-500", "bg-amber-500", "bg-rose-500",
    "bg-violet-500", "bg-pink-500", "bg-cyan-500", "bg-orange-500",
];

interface Props {
    card: Card;
    theme: BoardTheme;
    onClick: () => void;
    isDragging?: boolean;
    readOnly?: boolean;
    selectMode?: boolean;
    selected?: boolean;
    onToggleSelect?: () => void;
}

export default function CardItem({ card, theme, onClick, isDragging, readOnly = false, selectMode = false, selected = false, onToggleSelect }: Props) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging: sortableDragging,
    } = useSortable({
        id: `card-${card.id}`,
        data: { type: "card", card },
        disabled: readOnly || selectMode,
    });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: sortableDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...(!readOnly ? listeners : {})}
            onClick={(e) => {
                if (sortableDragging) return;
                e.stopPropagation();
                if (selectMode && onToggleSelect) {
                    onToggleSelect();
                    return;
                }
                onClick();
            }}
            className={cn(
                "group rounded-lg cursor-pointer transition-all overflow-hidden touch-none",
                "bg-white shadow-[0_1px_1px_rgba(9,30,66,0.25)]",
                "hover:shadow-[0_4px_8px_rgba(9,30,66,0.15)] hover:bg-[#f8f9fa]",
                selected && "ring-2 ring-blue-500",
                isDragging && "shadow-[0_8px_16px_rgba(9,30,66,0.2)] ring-2 ring-blue-400 rotate-1"
            )}
        >
            {selectMode && (
                <div className="px-2 pt-2 flex justify-end">
                    <input
                        type="checkbox"
                        checked={selected}
                        onChange={onToggleSelect}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        aria-label={`Select ${card.title}`}
                    />
                </div>
            )}
            <CardContent card={card} theme={theme} />
        </div>
    );
}

export function CardContent({ card, theme }: { card: Card; theme: BoardTheme }) {
    const hasChecklist = (card.checklist?.length ?? 0) > 0;
    const completedItems = card.checklist?.filter((i) => i.completed).length ?? 0;
    const totalItems = card.checklist?.length ?? 0;
    const hasOverdue = card.dueDate && isPast(new Date(card.dueDate)) && card.status !== "done";
    const isDueToday = card.dueDate && isToday(new Date(card.dueDate));
    const attachmentCount = card.attachments?.length ?? 0;
    const hasMeta =
        card.dueDate ||
        hasChecklist ||
        attachmentCount > 0 ||
        card.isWatched ||
        (card.assignees?.length ?? 0) > 0;

    return (
        <>
            {card.coverImage && (
                <div
                    className="h-[140px] bg-cover bg-center"
                    style={{ backgroundImage: `url(${card.coverImage})` }}
                />
            )}

            {card.labels && card.labels.length > 0 && !card.coverImage && (
                <div className="flex flex-wrap gap-1 px-2 pt-2">
                    {card.labels.slice(0, 6).map((label, idx) => (
                        <span
                            key={idx}
                            className={cn(
                                "h-2 min-w-[40px] max-w-[56px] rounded-sm",
                                LABEL_COLORS[idx % LABEL_COLORS.length]
                            )}
                            title={label}
                        />
                    ))}
                </div>
            )}

            <div className={cn("px-2 pb-2", card.coverImage ? "pt-2" : card.labels?.length ? "pt-1.5" : "pt-2")}>
                <p className="text-[13px] leading-[1.35] text-[#172b4d] font-normal break-words">
                    {card.title}
                </p>

                {hasMeta && (
                    <div className="flex items-end justify-between gap-2 mt-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {card.dueDate && (
                                <span
                                    className={cn(
                                        "inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-sm",
                                        hasOverdue
                                            ? "bg-[#ae2e24] text-white"
                                            : isDueToday
                                            ? "bg-[#E2B203] text-[#172b4d]"
                                            : "bg-[#dcdfe4] text-[#44546f]"
                                    )}
                                >
                                    <Clock className="h-3 w-3" />
                                    {format(new Date(card.dueDate), "MMM d")}
                                </span>
                            )}

                            {hasChecklist && (
                                <span
                                    className={cn(
                                        "inline-flex items-center gap-1 text-[11px] text-[#44546f]",
                                        completedItems === totalItems && "text-[#216e4e]"
                                    )}
                                >
                                    <CheckSquare className="h-3 w-3" />
                                    {completedItems}/{totalItems}
                                </span>
                            )}

                            {attachmentCount > 0 && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-[#44546f]">
                                    <Paperclip className="h-3 w-3" />
                                    {attachmentCount}
                                </span>
                            )}

                            {card.isWatched && (
                                <Eye className="h-3 w-3 text-[#44546f]" aria-label="Watching" />
                            )}
                        </div>

                        {card.assignees && card.assignees.length > 0 && (
                            <div className="flex -space-x-1 shrink-0">
                                {card.assignees.slice(0, 3).map((a) => (
                                    <Avatar
                                        key={a.id}
                                        src={a.user.avatar}
                                        name={a.user.name}
                                        size="xs"
                                        className="ring-2 ring-white"
                                    />
                                ))}
                                {card.assignees.length > 3 && (
                                    <div className="h-6 w-6 rounded-full bg-[#dfe1e6] flex items-center justify-center text-[9px] font-bold text-[#44546f] ring-2 ring-white">
                                        +{card.assignees.length - 3}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
