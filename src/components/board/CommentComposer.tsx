"use client";
import { useState, useRef, useCallback } from "react";
import { Textarea } from "@/components/ui";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import {
    getActiveMentionQuery,
    insertMention,
} from "@/lib/utils/parseMentions";
import { cn } from "@/utils/cn";

interface Member {
    userId: number;
    name: string;
    avatar?: string | null;
}

interface Props {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    onTyping?: () => void;
    members: Member[];
    userName: string;
    userAvatar?: string | null;
    loading?: boolean;
    placeholder?: string;
    replyToName?: string | null;
    onCancelReply?: () => void;
}

export default function CommentComposer({
    value,
    onChange,
    onSubmit,
    onTyping,
    members,
    userName,
    userAvatar,
    loading,
    placeholder = "Write a comment…",
    replyToName,
    onCancelReply,
}: Props) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [mentionIndex, setMentionIndex] = useState(0);

    const cursorPos = textareaRef.current?.selectionStart ?? value.length;
    const activeMention = getActiveMentionQuery(value, cursorPos);

    const filteredMembers = activeMention
        ? members.filter((m) => {
            const q = activeMention.query.toLowerCase();
            return q === "" || m.name.toLowerCase().includes(q);
        })
        : [];

    const showPicker = activeMention !== null && members.length > 0;

    const selectMember = useCallback(
        (member: Member) => {
            if (!activeMention || !textareaRef.current) return;
            const { newValue, newCursor } = insertMention(
                value,
                textareaRef.current.selectionStart,
                activeMention.start,
                member.name,
                member.userId
            );
            onChange(newValue);
            setMentionIndex(0);
            requestAnimationFrame(() => {
                textareaRef.current?.focus();
                textareaRef.current?.setSelectionRange(newCursor, newCursor);
            });
        },
        [activeMention, onChange, value]
    );

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (showPicker) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setMentionIndex((i) => Math.min(i + 1, filteredMembers.length - 1));
                return;
            }
            if (e.key === "ArrowUp") {
                e.preventDefault();
                setMentionIndex((i) => Math.max(i - 1, 0));
                return;
            }
            if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                selectMember(filteredMembers[mentionIndex]);
                return;
            }
            if (e.key === "Escape") {
                e.preventDefault();
                setMentionIndex(0);
                return;
            }
        }
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            onSubmit();
        }
    };

    return (
        <div className="relative">
            {replyToName && (
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 px-1 ml-10">
                    <span>Replying to <span className="font-medium text-slate-700">{replyToName}</span></span>
                    {onCancelReply && (
                        <button type="button" onClick={onCancelReply} className="text-blue-500 hover:underline cursor-pointer">
                            Cancel
                        </button>
                    )}
                </div>
            )}
            <div className="flex items-start gap-2">
                <Avatar
                    src={userAvatar}
                    name={userName}
                    size="sm"
                    className="h-8 w-8 shrink-0 mt-0.5"
                />
                <div className="flex-1 min-w-0 relative">
                    <Textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => {
                            onChange(e.target.value);
                            onTyping?.();
                            setMentionIndex(0);
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        rows={3}
                    />
                    {showPicker && (
                        <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-lg shadow-lg py-1 max-h-40 overflow-y-auto">
                            {filteredMembers.length === 0 ? (
                                <p className="px-3 py-2 text-xs text-slate-500">No members match</p>
                            ) : (
                                filteredMembers.map((m, idx) => (
                                    <button
                                        key={m.userId}
                                        type="button"
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            selectMember(m);
                                        }}
                                        className={cn(
                                            "w-full flex items-center gap-2 text-left px-3 py-1.5 text-sm cursor-pointer",
                                            idx === mentionIndex ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"
                                        )}
                                    >
                                        <Avatar src={m.avatar} name={m.name} size="xs" />
                                        <span>@{m.name}</span>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                    {value.trim() && (
                        <Button type="button" size="sm" onClick={onSubmit} loading={loading} className="mt-2">
                            Save
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
