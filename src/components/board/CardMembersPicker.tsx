"use client";

import { Plus, Check } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/utils/cn";

interface MemberOption {
    userId: number;
    name: string;
    avatar: string | null;
}

interface Props {
    members: MemberOption[];
    selectedIds: string[];
    onChange: (ids: string[]) => void;
    disabled?: boolean;
}

export default function CardMembersPicker({ members, selectedIds, onChange, disabled }: Props) {
    const selectedSet = new Set(selectedIds);

    const toggle = (id: string) => {
        if (selectedSet.has(id)) {
            onChange(selectedIds.filter((v) => v !== id));
        } else {
            onChange([...selectedIds, id]);
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            {members
                .filter((m) => selectedSet.has(String(m.userId)))
                .map((m) => (
                    <button
                        key={m.userId}
                        type="button"
                        disabled={disabled}
                        onClick={() => !disabled && toggle(String(m.userId))}
                        className={cn(
                            "group relative rounded-full ring-2 ring-white shadow-sm transition-transform",
                            !disabled && "hover:scale-105 cursor-pointer"
                        )}
                        title={disabled ? m.name : `${m.name} — click to remove`}
                    >
                        <Avatar src={m.avatar} name={m.name} size="sm" />
                    </button>
                ))}

            {!disabled && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className="flex items-center justify-center h-8 w-8 rounded-full border-2 border-dashed border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer outline-none"
                            aria-label="Add members"
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="min-w-[220px] z-[10050]">
                        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-slate-500">
                            Board members
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {members.length === 0 ? (
                            <div className="px-2 py-3 text-xs text-slate-400 text-center">No members</div>
                        ) : (
                            members.map((m) => {
                                const id = String(m.userId);
                                const checked = selectedSet.has(id);
                                return (
                                    <DropdownMenuItem
                                        key={m.userId}
                                        onSelect={(e) => {
                                            e.preventDefault();
                                            toggle(id);
                                        }}
                                        className="gap-2 cursor-pointer"
                                    >
                                        <Avatar src={m.avatar} name={m.name} size="xs" />
                                        <span className="flex-1 truncate text-sm">{m.name}</span>
                                        {checked && <Check className="h-4 w-4 text-blue-600 shrink-0" />}
                                    </DropdownMenuItem>
                                );
                            })
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
}
