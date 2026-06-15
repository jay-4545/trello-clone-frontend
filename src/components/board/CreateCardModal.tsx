"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Plus, Calendar, Flag, Tag, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import Modal from "@/components/ui/Modal";
import { useCreateCardMutation } from "@/lib/api/cardApi";
import type { CardPriority } from "@/types/card.types";
import { parseApiError } from "@/utils/errorParser";
import { cn } from "@/utils/cn";

const PRIORITIES: { value: CardPriority; label: string; color: string }[] = [
    { value: "critical", label: "Critical", color: "bg-red-500/20 text-red-300 border-red-500/30" },
    { value: "high", label: "High", color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
    { value: "medium", label: "Medium", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
    { value: "low", label: "Low", color: "bg-white/10 text-[#b6c2cf] border-white/20" },
];

const LABEL_COLORS = [
    "bg-emerald-500", "bg-blue-500", "bg-amber-500", "bg-rose-500",
    "bg-violet-500", "bg-pink-500", "bg-cyan-500", "bg-orange-500",
];

const schema = z.object({
    title: z.string().min(1, "Title is required").max(500, "Title too long"),
    description: z.string().max(5000, "Description too long").optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
    open: boolean;
    onClose: () => void;
    workspaceId: number;
    boardId: number;
    listId: number;
    listName?: string;
}

export default function CreateCardModal({
    open, onClose, workspaceId, boardId, listId, listName,
}: Props) {
    const [createCard, { isLoading }] = useCreateCardMutation();

    const [priority, setPriority] = useState<CardPriority>("medium");
    const [dueDate, setDueDate] = useState("");
    const [labels, setLabels] = useState<string[]>([]);
    const [tags, setTags] = useState<string[]>([]);
    const [labelInput, setLabelInput] = useState("");
    const [tagInput, setTagInput] = useState("");
    const [showMore, setShowMore] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<FormData>({ resolver: zodResolver(schema) });

    useEffect(() => {
        if (!open) {
            setPriority("medium");
            setDueDate("");
            setLabels([]);
            setTags([]);
            setLabelInput("");
            setTagInput("");
            setShowMore(false);
            reset();
        }
    }, [open, reset]);

    const addLabel = () => {
        const t = labelInput.trim();
        if (!t || labels.includes(t)) return;
        setLabels((prev) => [...prev, t]);
        setLabelInput("");
    };

    const addTag = () => {
        const t = tagInput.trim();
        if (!t || tags.includes(t)) return;
        setTags((prev) => [...prev, t]);
        setTagInput("");
    };

    const onSubmit = async (data: FormData) => {
        try {
            await createCard({
                workspaceId,
                boardId,
                listId,
                body: {
                    title: data.title,
                    description: data.description || undefined,
                    priority,
                    dueDate: dueDate || undefined,
                    labels: labels.length > 0 ? labels : undefined,
                    tags: tags.length > 0 ? tags : undefined,
                },
            }).unwrap();
            toast.success("Card created");
            onClose();
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Create card"
            description={listName ? `in list "${listName}"` : undefined}
            size="md"
            className="!bg-[#282e33] !text-[#b6c2cf] [&_h2]:!text-white [&_p]:!text-[#9fadbc]"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-[#9fadbc] mb-1.5 uppercase tracking-wide">
                        Card title
                    </label>
                    <textarea
                        placeholder="Enter a title for this card…"
                        rows={3}
                        autoFocus
                        className="w-full text-sm text-[#172b4d] bg-white border-0 rounded-lg px-3 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder:text-slate-400"
                        {...register("title")}
                    />
                    {errors.title?.message && (
                        <p className="text-xs text-red-400 mt-1">{errors.title.message}</p>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-semibold text-[#9fadbc] mb-1.5 uppercase tracking-wide">
                        Description
                    </label>
                    <textarea
                        placeholder="Add more details (optional)"
                        rows={3}
                        className="w-full text-sm text-white bg-[#22272b] border border-white/15 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder:text-[#6b778c]"
                        {...register("description")}
                    />
                </div>

                <button
                    type="button"
                    onClick={() => setShowMore((v) => !v)}
                    className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer"
                >
                    {showMore ? "Hide options" : "Show more options (priority, due date, labels)"}
                </button>

                {showMore && (
                    <div className="space-y-4 pt-2 border-t border-white/10">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-semibold text-[#9fadbc] mb-2 flex items-center gap-1.5">
                                    <Flag className="h-3.5 w-3.5" />
                                    Priority
                                </p>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {PRIORITIES.map((p) => (
                                        <button
                                            key={p.value}
                                            type="button"
                                            onClick={() => setPriority(p.value)}
                                            className={cn(
                                                "text-xs font-semibold px-2 py-1.5 rounded border transition-all flex items-center justify-center gap-1 cursor-pointer",
                                                p.color,
                                                priority === p.value
                                                    ? "ring-2 ring-blue-400"
                                                    : "opacity-70 hover:opacity-100"
                                            )}
                                        >
                                            {p.value === "critical" && <AlertTriangle className="h-3 w-3" />}
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-semibold text-[#9fadbc] mb-2 flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Due date
                                </p>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full text-sm bg-[#22272b] border border-white/15 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-semibold text-[#9fadbc] mb-2 flex items-center gap-1.5">
                                <Tag className="h-3.5 w-3.5" />
                                Labels
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 mb-2">
                                {labels.map((l, idx) => (
                                    <span
                                        key={l}
                                        className={cn(
                                            "inline-flex items-center gap-1 text-xs font-medium text-white px-2 py-1 rounded",
                                            LABEL_COLORS[idx % LABEL_COLORS.length]
                                        )}
                                    >
                                        {l}
                                        <button
                                            type="button"
                                            onClick={() => setLabels(labels.filter((x) => x !== l))}
                                            className="hover:bg-black/20 rounded cursor-pointer"
                                            aria-label={`Remove label ${l}`}
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    value={labelInput}
                                    onChange={(e) => setLabelInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLabel(); } }}
                                    placeholder="Add a label…"
                                    className="flex-1 text-sm bg-[#22272b] border border-white/15 rounded-lg px-3 py-2 text-white placeholder:text-[#6b778c] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    type="button"
                                    onClick={addLabel}
                                    disabled={!labelInput.trim()}
                                    className="flex items-center justify-center h-9 w-9 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40 text-[#c9d1d9] cursor-pointer"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 text-sm font-medium text-[#c9d1d9] bg-white/10 hover:bg-white/15 rounded-lg py-2.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 text-sm font-medium text-white bg-[#0c66e4] hover:bg-[#0055cc] disabled:opacity-50 rounded-lg py-2.5 transition-colors cursor-pointer"
                    >
                        {isLoading ? "Creating…" : "Create card"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
