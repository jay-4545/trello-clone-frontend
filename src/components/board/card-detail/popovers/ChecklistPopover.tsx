"use client";
import { Button, Input } from "@/components/ui";
import type { CardDetailActions } from "../useCardDetailActions";

interface Props {
    actions: CardDetailActions;
    onClose: () => void;
}

export default function ChecklistPopover({ actions, onClose }: Props) {
    const { newChecklistItem, setNewChecklistItem, handleAddChecklist } = actions;

    const add = () => {
        if (!newChecklistItem.trim()) return;
        handleAddChecklist();
        onClose();
    };

    return (
        <div className="space-y-3">
            <div>
                <label className="text-xs text-[#5e6c84] mb-1 block">Title</label>
                <Input
                    autoFocus
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") add(); }}
                    placeholder="Checklist item…"
                />
            </div>
            <Button type="button" size="sm" className="w-full" onClick={add} disabled={!newChecklistItem.trim()}>
                Add
            </Button>
        </div>
    );
}
