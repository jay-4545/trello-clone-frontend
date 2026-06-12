"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    Clock,
    MessageSquare,
    CheckSquare,
    Paperclip,
    AlertTriangle,
} from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import type { Card } from "@/types/card.types";
import { cn } from "@/utils/cn";

const PRIORITY_COLORS: Record<string, string> = {
    critical: "bg-red-100 text-red-700 border-red-200",
    high: "bg-orange-100 text-orange-700 border-orange-200",
    medium: "bg-blue-100 text-blue-700 border-blue-200",
    low: "bg-slate-100 text-slate-600 border-slate-200",
};

const LABEL_COLORS = [
    "bg-emerald-500", "bg-blue-500", "bg-amber-500", "bg-rose-500",
    "bg-violet-500", "bg-pink-500", "bg-cyan-500", "bg-orange-500",
];

interface Props {
    card: Card;
    onClick: () => void;
    isDragging?: boolean;
    readOnly?: boolean;
}

export default function CardItem({ card, onClick, isDragging, readOnly = false }: Props) {
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
        disabled: readOnly,
    });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: sortableDragging ? 0.4 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...(!readOnly ? listeners : {})}
            onClick={(e) => {
                // Only fire click if not dragging
                if (sortableDragging) return;
                e.stopPropagation();
                onClick();
            }}
            className={cn(
                "bg-white rounded-lg shadow-sm border border-slate-200 hover:border-slate-300 cursor-pointer hover:shadow-md transition-all overflow-hidden group touch-none",
                isDragging && "shadow-xl ring-2 ring-blue-300 rotate-2"
            )}
        >
            <CardContent card={card} />
        </div>
    );
}

export function CardContent({ card }: { card: Card }) {
    const hasChecklist = (card.checklist?.length ?? 0) > 0;
    const completedItems = card.checklist?.filter((i) => i.completed).length ?? 0;
    const totalItems = card.checklist?.length ?? 0;
    const hasOverdue = card.dueDate && isPast(new Date(card.dueDate)) && card.status !== "done";
    const isDueToday = card.dueDate && isToday(new Date(card.dueDate));

    return (
        <>
            {card.coverImage && (
                <div
                    className="h-20 bg-cover bg-center"
                    style={{ backgroundImage: `url(${card.coverImage})` }}
                />
            )}

            <div className="p-2.5 space-y-2">
                {/* Labels */}
                {card.labels && card.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {card.labels.slice(0, 6).map((label, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "h-1.5 w-8 rounded-full",
                                    LABEL_COLORS[idx % LABEL_COLORS.length]
                                )}
                                title={label}
                            />
                        ))}
                    </div>
                )}

                {/* Title */}
                <p className="text-sm text-slate-800 leading-snug line-clamp-3 break-words">
                    {card.title}
                </p>

                {/* Meta footer */}
                {(card.priority !== "medium" ||
                    card.dueDate ||
                    hasChecklist ||
                    (card.assignees?.length ?? 0) > 0 ||
                    (card.tags?.length ?? 0) > 0) && (
                    <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Priority badge */}
                            {card.priority && card.priority !== "medium" && (
                                <span
                                    className={cn(
                                        "inline-flex items-center text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border",
                                        PRIORITY_COLORS[card.priority]
                                    )}
                                >
                                    {card.priority === "critical" && (
                                        <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                                    )}
                                    {card.priority}
                                </span>
                            )}

                            {/* Due date */}
                            {card.dueDate && (
                                <span
                                    className={cn(
                                        "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded",
                                        hasOverdue
                                            ? "bg-red-100 text-red-700"
                                            : isDueToday
                                            ? "bg-amber-100 text-amber-700"
                                            : "bg-slate-100 text-slate-600"
                                    )}
                                >
                                    <Clock className="h-2.5 w-2.5" />
                                    {format(new Date(card.dueDate), "MMM d")}
                                </span>
                            )}

                            {/* Checklist */}
                            {hasChecklist && (
                                <span
                                    className={cn(
                                        "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded",
                                        completedItems === totalItems
                                            ? "bg-green-100 text-green-700"
                                            : "bg-slate-100 text-slate-600"
                                    )}
                                >
                                    <CheckSquare className="h-2.5 w-2.5" />
                                    {completedItems}/{totalItems}
                                </span>
                            )}

                            {/* Attachments */}
                            {card.attachments && card.attachments.length > 0 && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                                    <Paperclip className="h-2.5 w-2.5" />
                                    {card.attachments.length}
                                </span>
                            )}
                        </div>

                        {/* Assignees */}
                        {card.assignees && card.assignees.length > 0 && (
                            <div className="flex -space-x-1.5">
                                {card.assignees.slice(0, 3).map((a) => (
                                    <div
                                        key={a.id}
                                        className="h-5 w-5 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-[9px] font-bold border-2 border-white"
                                        title={a.user.name}
                                    >
                                        {a.user.name[0].toUpperCase()}
                                    </div>
                                ))}
                                {card.assignees.length > 3 && (
                                    <div className="h-5 w-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-[9px] font-bold border-2 border-white">
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
