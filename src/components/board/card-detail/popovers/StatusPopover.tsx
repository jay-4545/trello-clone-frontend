"use client";
import { Label } from "@/components/ui/label";
import Select from "@/components/ui/Select";
import type { Card } from "@/types/card.types";
import type { CardDetailActions } from "../useCardDetailActions";
import { STATUS_OPTIONS, PRIORITY_OPTIONS } from "../constants";

interface Props {
    card: Card;
    actions: CardDetailActions;
}

export default function StatusPopover({ card, actions }: Props) {
    const { updateField } = actions;

    return (
        <div className="space-y-3">
            <div>
                <Label className="text-xs mb-1 block text-[#5e6c84]">Status</Label>
                <Select options={STATUS_OPTIONS} value={card.status} onChange={(s) => updateField({ status: s })} size="sm" inModal />
            </div>
            <div>
                <Label className="text-xs mb-1 block text-[#5e6c84]">Priority</Label>
                <Select options={PRIORITY_OPTIONS} value={card.priority} onChange={(p) => updateField({ priority: p })} size="sm" inModal />
            </div>
        </div>
    );
}
