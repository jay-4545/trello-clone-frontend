"use client";
import { Timer } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { Label } from "@/components/ui/label";
import DatePicker from "@/components/ui/date-picker";
import type { Card } from "@/types/card.types";
import type { CardDetailActions } from "../useCardDetailActions";

interface Props {
    card: Card;
    actions: CardDetailActions;
    onClose: () => void;
}

export default function DatesPopover({ card, actions, onClose }: Props) {
    const { estimateValue, setEstimateValue, handleEstimateBlur, updateField } = actions;

    const clearDates = () => {
        updateField({ startDate: null, dueDate: null });
        onClose();
    };

    return (
        <div className="space-y-3">
            <div>
                <Label className="text-xs mb-1 block text-[#5e6c84]">Start date</Label>
                <DatePicker value={card.startDate} onChange={(v) => updateField({ startDate: v })} placeholder="No start" />
            </div>
            <div>
                <Label className="text-xs mb-1 block text-[#5e6c84]">Due date</Label>
                <DatePicker value={card.dueDate} onChange={(v) => updateField({ dueDate: v })} placeholder="No due date" />
            </div>
            <div>
                <Label className="text-xs mb-1 flex items-center gap-1 text-[#5e6c84]">
                    <Timer className="h-3 w-3" /> Estimate (hours)
                </Label>
                <Input
                    type="number"
                    min={0}
                    step={0.5}
                    value={estimateValue}
                    onChange={(e) => setEstimateValue(e.target.value)}
                    onBlur={handleEstimateBlur}
                    placeholder="e.g. 4"
                    className="text-xs"
                />
            </div>
            {(card.startDate || card.dueDate) && (
                <Button type="button" size="sm" variant="outline" className="w-full" onClick={clearDates}>
                    Remove dates
                </Button>
            )}
        </div>
    );
}
