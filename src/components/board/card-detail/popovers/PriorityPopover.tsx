"use client";
import type { Card } from "@/types/card.types";
import type { CardDetailActions } from "../useCardDetailActions";
import { PRIORITIES } from "../constants";
import { cn } from "@/utils/cn";
import { Check } from "lucide-react";

interface Props {
    card: Card;
    actions: CardDetailActions;
}

export default function PriorityPopover({ card, actions }: Props) {
    const { updateField } = actions;

    return (
        <div className="space-y-2">
            <p className="text-xs text-[#5e6c84]">Select priority for this card</p>
            <div className="grid grid-cols-2 gap-2">
                {PRIORITIES.map((p) => {
                    const selected = card.priority === p.value;
                    return (
                        <button
                            key={p.value}
                            type="button"
                            onClick={() => updateField({ priority: p.value })}
                            className={cn(
                                "flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer",
                                selected ? p.color : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                            )}
                        >
                            <span>{p.label}</span>
                            {selected && <Check className="h-4 w-4 shrink-0" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
