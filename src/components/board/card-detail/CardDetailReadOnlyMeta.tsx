"use client";
import { format } from "date-fns";
import { Users, Calendar, Tag, Hash } from "lucide-react";
import type { Card } from "@/types/card.types";
import Avatar from "@/components/ui/Avatar";
import { cn } from "@/utils/cn";

const LABEL_COLORS = [
    "bg-emerald-500", "bg-blue-500", "bg-amber-500", "bg-rose-500",
    "bg-violet-500", "bg-pink-500", "bg-cyan-500", "bg-orange-500",
];

interface Props {
    card: Card;
    className?: string;
}

export default function CardDetailReadOnlyMeta({ card, className }: Props) {
    const hasLabels = (card.labels?.length ?? 0) > 0;
    const hasTags = (card.tags?.length ?? 0) > 0;
    const hasAssignees = (card.assignees?.length ?? 0) > 0;
    const hasDates = card.startDate || card.dueDate;

    if (!hasLabels && !hasTags && !hasAssignees && !hasDates) return null;

    return (
        <div className={cn("rounded-lg border border-slate-200 bg-slate-50/80 p-3 space-y-3", className)}>
            {hasAssignees && (
                <div className="flex items-start gap-2">
                    <Users className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                    <div className="flex flex-wrap items-center gap-2">
                        {card.assignees!.map((a) => (
                            <span key={a.id} className="inline-flex items-center gap-1.5 text-xs text-slate-700">
                                <Avatar src={a.user.avatar} name={a.user.name} size="xs" />
                                {a.user.name}
                            </span>
                        ))}
                    </div>
                </div>
            )}
            {hasDates && (
                <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                    <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                        {card.startDate && (
                            <span>Start {format(new Date(card.startDate), "MMM d, yyyy")}</span>
                        )}
                        {card.dueDate && (
                            <span>Due {format(new Date(card.dueDate), "MMM d, yyyy")}</span>
                        )}
                    </div>
                </div>
            )}
            {hasLabels && (
                <div className="flex items-start gap-2">
                    <Tag className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                    <div className="flex flex-wrap gap-1">
                        {card.labels!.map((l, idx) => (
                            <span
                                key={l}
                                className={cn(
                                    "text-xs font-medium text-white px-2 py-0.5 rounded",
                                    LABEL_COLORS[idx % LABEL_COLORS.length]
                                )}
                            >
                                {l}
                            </span>
                        ))}
                    </div>
                </div>
            )}
            {hasTags && (
                <div className="flex items-start gap-2">
                    <Hash className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                    <div className="flex flex-wrap gap-1">
                        {card.tags!.map((t) => (
                            <span
                                key={t}
                                className="text-xs text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded"
                            >
                                {t}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
