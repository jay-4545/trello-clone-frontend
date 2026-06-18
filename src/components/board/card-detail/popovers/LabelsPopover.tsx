"use client";
import { Plus, X } from "lucide-react";
import { Button, Input, Badge } from "@/components/ui";
import type { Card } from "@/types/card.types";
import type { CardDetailActions } from "../useCardDetailActions";
import { LABEL_COLORS } from "../constants";
import { cn } from "@/utils/cn";

interface Props {
    card: Card;
    actions: CardDetailActions;
}

export default function LabelsPopover({ card, actions }: Props) {
    const { labelInput, setLabelInput, handleAddLabel, handleRemoveLabel } = actions;

    return (
        <div>
            <div className="flex flex-wrap gap-1.5 mb-3">
                {(card.labels ?? []).map((l, idx) => (
                    <Badge key={l} size="sm" className={cn("text-white border-0", LABEL_COLORS[idx % LABEL_COLORS.length])}>
                        {l}
                        <button type="button" onClick={() => handleRemoveLabel(l)} className="ml-1 cursor-pointer">
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}
            </div>
            <div className="flex gap-2">
                <Input
                    value={labelInput}
                    onChange={(e) => setLabelInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddLabel(); } }}
                    placeholder="Label name…"
                    className="text-xs"
                />
                <Button type="button" size="sm" onClick={handleAddLabel} disabled={!labelInput.trim()}>
                    <Plus className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    );
}
