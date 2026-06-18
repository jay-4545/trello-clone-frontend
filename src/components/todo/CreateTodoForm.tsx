"use client";
import { useState } from "react";
import { Plus, Calendar, Flag } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useCreateTodoMutation } from "@/lib/api/todoApi";
import type { TodoPriority } from "@/lib/api/todoApi";
import { parseApiError } from "@/utils/errorParser";
import { cn } from "@/utils/cn";

const PRIORITIES: { value: TodoPriority; label: string; color: string }[] = [
    { value: "high", label: "High", color: "bg-red-100 text-red-700 border-red-200" },
    { value: "medium", label: "Medium", color: "bg-amber-100 text-amber-700 border-amber-200" },
    { value: "low", label: "Low", color: "bg-slate-100 text-slate-600 border-slate-200" },
];

export default function CreateTodoForm() {
    const [createTodo, { isLoading }] = useCreateTodoMutation();
    const [expanded, setExpanded] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState<TodoPriority>("medium");
    const [dueDate, setDueDate] = useState("");

    const reset = () => {
        setTitle("");
        setDescription("");
        setPriority("medium");
        setDueDate("");
        setExpanded(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = title.trim();
        if (!trimmed) return;

        try {
            await createTodo({
                title: trimmed,
                description: description.trim() || undefined,
                priority,
                dueDate: dueDate || undefined,
            }).unwrap();
            toast.success("Task added");
            reset();
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    if (!expanded) {
        return (
            <button
                type="button"
                onClick={() => setExpanded(true)}
                className="w-full flex items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50 transition-colors cursor-pointer"
            >
                <Plus className="h-4 w-4" />
                Add a personal task…
            </button>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3"
        >
            <Input
                autoFocus
                placeholder="What needs to be done?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full text-sm text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1">
                    <Flag className="h-3.5 w-3.5 text-slate-400" />
                    {PRIORITIES.map((p) => (
                        <button
                            key={p.value}
                            type="button"
                            onClick={() => setPriority(p.value)}
                            className={cn(
                                "text-xs font-medium px-2 py-0.5 rounded-full border transition-colors cursor-pointer",
                                priority === p.value ? p.color : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                            )}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>
            <div className="flex items-center gap-2 justify-end">
                <Button type="button" variant="ghost" size="sm" onClick={reset}>
                    Cancel
                </Button>
                <Button type="submit" size="sm" loading={isLoading} disabled={!title.trim()}>
                    Add task
                </Button>
            </div>
        </form>
    );
}
