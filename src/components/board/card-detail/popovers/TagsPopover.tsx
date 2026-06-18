"use client";
import { Plus, X } from "lucide-react";
import { Button, Input } from "@/components/ui";
import type { Card } from "@/types/card.types";
import type { CardDetailActions } from "../useCardDetailActions";
import { cn } from "@/utils/cn";

interface Props {
    card: Card;
    actions: CardDetailActions;
}

export default function TagsPopover({ card, actions }: Props) {
    const { tagInput, setTagInput, handleAddTag, handleRemoveTag } = actions;

    return (
        <div>
            <div className="flex flex-wrap gap-1.5 mb-3">
                {(card.tags ?? []).map((t) => (
                    <span
                        key={t}
                        className={cn(
                            "inline-flex items-center gap-1 text-xs font-medium text-slate-600",
                            "bg-slate-100 border border-slate-200 px-2 py-0.5 rounded"
                        )}
                    >
                        {t}
                        <button type="button" onClick={() => handleRemoveTag(t)} className="cursor-pointer text-slate-400 hover:text-slate-600">
                            <X className="h-3 w-3" />
                        </button>
                    </span>
                ))}
            </div>
            <div className="flex gap-2">
                <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(); } }}
                    placeholder="Tag name…"
                    className="text-xs"
                />
                <Button type="button" size="sm" onClick={handleAddTag} disabled={!tagInput.trim()}>
                    <Plus className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    );
}
