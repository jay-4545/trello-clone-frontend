"use client";
import { useState, useMemo } from "react";
import { Check } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { Input } from "@/components/ui";
import type { CardDetailActions } from "../useCardDetailActions";
import { cn } from "@/utils/cn";

interface BoardMember {
    userId: number;
    name: string;
    avatar: string | null;
}

interface Props {
    boardMembers: BoardMember[];
    assigneeIds: string[];
    actions: CardDetailActions;
}

export default function MembersPopover({ boardMembers, assigneeIds, actions }: Props) {
    const [search, setSearch] = useState("");
    const { handleAssigneesChange } = actions;
    const selectedSet = new Set(assigneeIds);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return boardMembers;
        return boardMembers.filter((m) => m.name.toLowerCase().includes(q));
    }, [boardMembers, search]);

    const toggle = (id: string) => {
        if (selectedSet.has(id)) {
            handleAssigneesChange(assigneeIds.filter((v) => v !== id));
        } else {
            handleAssigneesChange([...assigneeIds, id]);
        }
    };

    return (
        <div>
            <Input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search members"
                className="text-sm mb-3"
            />
            <p className="text-xs font-semibold text-[#5e6c84] uppercase tracking-wide mb-2">Board members</p>
            <div className="max-h-[240px] overflow-y-auto space-y-0.5">
                {filtered.map((m) => {
                    const id = String(m.userId);
                    const selected = selectedSet.has(id);
                    return (
                        <button
                            key={m.userId}
                            type="button"
                            onClick={() => toggle(id)}
                            className={cn(
                                "flex items-center gap-2 w-full px-2 py-2 rounded-lg text-sm text-left cursor-pointer transition-colors",
                                selected ? "bg-slate-100" : "hover:bg-slate-50"
                            )}
                        >
                            <Avatar src={m.avatar} name={m.name} size="sm" />
                            <span className="flex-1 text-[#172b4d] font-medium truncate">{m.name}</span>
                            {selected && <Check className="h-4 w-4 text-blue-600 shrink-0" />}
                        </button>
                    );
                })}
                {filtered.length === 0 && (
                    <p className="text-xs text-slate-500 py-2 text-center">No members found</p>
                )}
            </div>
        </div>
    );
}
