"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Plus, Calendar, Flag, Tag, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import Modal from "@/components/ui/Modal";
import { Button, Input, Textarea } from "@/components/ui";
import { useCreateCardMutation } from "@/lib/api/cardApi";
import type { CardPriority } from "@/types/card.types";
import { parseApiError } from "@/utils/errorParser";
import { cn } from "@/utils/cn";

const PRIORITIES: { value: CardPriority; label: string; color: string }[] = [
    { value: "critical", label: "Critical", color: "bg-red-100 text-red-700 border-red-300" },
    { value: "high", label: "High", color: "bg-orange-100 text-orange-700 border-orange-300" },
    { value: "medium", label: "Medium", color: "bg-blue-100 text-blue-700 border-blue-300" },
    { value: "low", label: "Low", color: "bg-slate-100 text-slate-600 border-slate-300" },
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

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<FormData>({ resolver: zodResolver(schema) });

    useEffect(() => {
        if (!open) {
            // Reset on close
            setPriority("medium");
            setDueDate("");
            setLabels([]);
            setTags([]);
            setLabelInput("");
            setTagInput("");
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
            description={listName ? `in ${listName}` : undefined}
            size="lg"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                    label="Title"
                    placeholder="e.g. Design landing page"
                    required
                    error={errors.title?.message}
                    autoFocus
                    {...register("title")}
                />

                <Textarea
                    label="Description"
                    placeholder="Add more context (optional)"
                    rows={3}
                    error={errors.description?.message}
                    {...register("description")}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Priority */}
                    <div>
                        <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
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
                                        "text-xs font-semibold uppercase px-2 py-1.5 rounded border transition-all flex items-center justify-center gap-1",
                                        p.color,
                                        priority === p.value
                                            ? "ring-2 ring-offset-1 ring-blue-500"
                                            : "opacity-60 hover:opacity-100"
                                    )}
                                >
                                    {p.value === "critical" && <AlertTriangle className="h-3 w-3" />}
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Due date */}
                    <div>
                        <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            Due date
                        </p>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Labels */}
                <div>
                    <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
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
                                    className="hover:bg-black/20 rounded"
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
                            placeholder="Add a label..."
                            className="flex-1 text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={addLabel}
                            disabled={!labelInput.trim()}
                        >
                            <Plus className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>

                {/* Tags */}
                <div>
                    <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5" />
                        Tags
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        {tags.map((t) => (
                            <span
                                key={t}
                                className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded"
                            >
                                #{t}
                                <button
                                    type="button"
                                    onClick={() => setTags(tags.filter((x) => x !== t))}
                                    className="hover:bg-slate-200 rounded"
                                    aria-label={`Remove tag ${t}`}
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                            placeholder="Add a tag..."
                            className="flex-1 text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={addTag}
                            disabled={!tagInput.trim()}
                        >
                            <Plus className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="outline" fullWidth onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" fullWidth loading={isLoading}>
                        Create card
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
