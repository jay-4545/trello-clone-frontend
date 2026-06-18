"use client";
import {
    Clock,
    CheckSquare,
    Paperclip,
    Eye,
    Timer,
    MessageSquare,
    Flag,
} from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import type { Card, CardPriority, CardStatus } from "@/types/card.types";
import { cn } from "@/utils/cn";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";

const LABEL_COLORS = [
    "bg-emerald-500", "bg-blue-500", "bg-amber-500", "bg-rose-500",
    "bg-violet-500", "bg-pink-500", "bg-cyan-500", "bg-orange-500",
];

const PRIORITY_LABEL: Record<CardPriority, string> = {
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
};
const PRIORITY_VARIANT: Record<CardPriority, "danger" | "warning" | "default" | "info"> = {
    critical: "danger",
    high: "danger",
    medium: "warning",
    low: "default",
};

const STATUS_LABEL: Record<CardStatus, string> = {
    open: "Open",
    in_progress: "In progress",
    in_review: "In review",
    done: "Done",
    archived: "Archived",
};

interface Props {
    card: Card;
    variant?: "card" | "detail";
    commentCount?: number;
    listName?: string;
    showLabels?: boolean;
    onPriorityClick?: () => void;
    className?: string;
}

/** Shared metadata row — matches what appears on the card face, plus detail extras. */
export default function CardMetaBar({
    card,
    variant = "card",
    commentCount = 0,
    listName,
    showLabels = true,
    onPriorityClick,
    className,
}: Props) {
    const hasChecklist = (card.checklist?.length ?? 0) > 0;
    const completedItems = card.checklist?.filter((i) => i.completed).length ?? 0;
    const totalItems = card.checklist?.length ?? 0;
    const hasOverdue = card.dueDate && isPast(new Date(card.dueDate)) && card.status !== "done";
    const isDueToday = card.dueDate && isToday(new Date(card.dueDate));
    const attachmentCount = card.attachments?.length ?? 0;
    const tagCount = card.tags?.length ?? 0;
    const isDetail = variant === "detail";

    const hasMeta =
        card.dueDate ||
        card.startDate ||
        hasChecklist ||
        attachmentCount > 0 ||
        card.isWatched ||
        card.estimateHours != null ||
        (card.assignees?.length ?? 0) > 0 ||
        commentCount > 0 ||
        card.priority !== "medium" ||
        isDetail;

    if (!hasMeta && !(showLabels && card.labels?.length) && tagCount === 0) return null;

    return (
        <div className={cn("space-y-2", className)}>
            {showLabels && card.labels && card.labels.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {card.labels.map((label, idx) => (
                        <span
                            key={label}
                            className={cn(
                                isDetail
                                    ? "text-xs font-medium text-white px-2 py-0.5 rounded"
                                    : "h-2 min-w-[40px] max-w-[56px] rounded-sm",
                                LABEL_COLORS[idx % LABEL_COLORS.length]
                            )}
                            title={label}
                        >
                            {isDetail ? label : null}
                        </span>
                    ))}
                </div>
            )}

            {tagCount > 0 && (
                <div className="flex flex-wrap gap-1">
                    {card.tags!.slice(0, isDetail ? 8 : 3).map((tag) => (
                        <span
                            key={tag}
                            className={cn(
                                "inline-block font-medium rounded truncate max-w-[120px]",
                                isDetail
                                    ? "text-xs text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5"
                                    : "text-[10px] text-[#44546f] bg-[#f1f2f4] px-1.5 py-0.5 max-w-[80px]"
                            )}
                            title={tag}
                        >
                            {tag}
                        </span>
                    ))}
                    {tagCount > (isDetail ? 8 : 3) && (
                        <span className="text-[10px] text-slate-500">+{tagCount - (isDetail ? 8 : 3)}</span>
                    )}
                </div>
            )}

            {isDetail && (
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="info" size="sm">{STATUS_LABEL[card.status]}</Badge>
                    <button
                        type="button"
                        onClick={onPriorityClick}
                        disabled={!onPriorityClick}
                        className={cn(
                            "inline-flex",
                            onPriorityClick && "cursor-pointer rounded hover:opacity-80 transition-opacity"
                        )}
                    >
                        <Badge variant={PRIORITY_VARIANT[card.priority]} size="sm">
                            <Flag className="h-3 w-3 mr-0.5" />
                            {PRIORITY_LABEL[card.priority]}
                        </Badge>
                    </button>
                </div>
            )}

            {hasMeta && (
                <div className={cn(
                    "flex items-end justify-between gap-2",
                    isDetail && "pt-1 border-t border-slate-100"
                )}>
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {card.startDate && isDetail && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-600">
                                <Clock className="h-3 w-3" />
                                Start {format(new Date(card.startDate), "MMM d")}
                            </span>
                        )}

                        {card.dueDate && (
                            <span
                                className={cn(
                                    "inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-sm",
                                    hasOverdue
                                        ? "bg-[#ae2e24] text-white"
                                        : isDueToday
                                        ? "bg-[#E2B203] text-[#172b4d]"
                                        : isDetail
                                        ? "bg-slate-100 text-slate-600"
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
                                    "inline-flex items-center gap-1 text-[11px]",
                                    isDetail ? "text-slate-600" : "text-[#44546f]",
                                    completedItems === totalItems && "text-[#216e4e]"
                                )}
                            >
                                <CheckSquare className="h-3 w-3" />
                                {completedItems}/{totalItems}
                            </span>
                        )}

                        {attachmentCount > 0 && (
                            <span className={cn(
                                "inline-flex items-center gap-1 text-[11px]",
                                isDetail ? "text-slate-600" : "text-[#44546f]"
                            )}>
                                <Paperclip className="h-3 w-3" />
                                {attachmentCount}
                            </span>
                        )}

                        {card.estimateHours != null && (
                            <span className={cn(
                                "inline-flex items-center gap-1 text-[11px]",
                                isDetail ? "text-slate-600" : "text-[#44546f]"
                            )}>
                                <Timer className="h-3 w-3" />
                                {card.estimateHours}h
                            </span>
                        )}

                        {commentCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-600">
                                <MessageSquare className="h-3 w-3" />
                                {commentCount}
                            </span>
                        )}

                        {card.isWatched && (
                            <Eye className={cn("h-3 w-3", isDetail ? "text-blue-500" : "text-[#44546f]")} aria-label="Watching" />
                        )}

                        {!isDetail && card.priority !== "medium" && (
                            <span
                                className={cn(
                                    "inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-sm",
                                    card.priority === "critical" && "bg-red-100 text-red-700",
                                    card.priority === "high" && "bg-orange-100 text-orange-700",
                                    card.priority === "low" && "bg-slate-100 text-slate-600"
                                )}
                                title={`Priority: ${PRIORITY_LABEL[card.priority]}`}
                            >
                                <Flag className="h-3 w-3" />
                                {PRIORITY_LABEL[card.priority]}
                            </span>
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
                                    title={a.user.name}
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
    );
}
