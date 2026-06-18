"use client";
import { useState } from "react";
import { format, isPast, isToday } from "date-fns";
import { Calendar, Pencil, Trash2, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Input from "@/components/ui/Input";
import {
    useUpdateTodoMutation,
    useDeleteTodoMutation,
    type Todo,
    type TodoPriority,
    type TodoStatus,
} from "@/lib/api/todoApi";
import { parseApiError } from "@/utils/errorParser";
import { cn } from "@/utils/cn";

const PRIORITY_VARIANT: Record<TodoPriority, "danger" | "warning" | "default"> = {
    high: "danger",
    medium: "warning",
    low: "default",
};

const STATUS_CYCLE: TodoStatus[] = ["pending", "in_progress", "completed"];

interface Props {
    todo: Todo;
}

export default function TodoItem({ todo }: Props) {
    const [updateTodo, { isLoading: updating }] = useUpdateTodoMutation();
    const [deleteTodo, { isLoading: deleting }] = useDeleteTodoMutation();
    const [editing, setEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(todo.title);
    const [editDescription, setEditDescription] = useState(todo.description ?? "");
    const [confirmDelete, setConfirmDelete] = useState(false);

    const isCompleted = todo.status === "completed";
    const hasOverdue =
        todo.dueDate && !isCompleted && isPast(new Date(todo.dueDate)) && !isToday(new Date(todo.dueDate));
    const isDueToday = todo.dueDate && isToday(new Date(todo.dueDate));

    const cycleStatus = async () => {
        const idx = STATUS_CYCLE.indexOf(todo.status);
        const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
        try {
            await updateTodo({ id: todo.id, body: { status: next } }).unwrap();
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handleSaveEdit = async () => {
        const trimmed = editTitle.trim();
        if (!trimmed) return;
        try {
            await updateTodo({
                id: todo.id,
                body: {
                    title: trimmed,
                    description: editDescription.trim() || "",
                },
            }).unwrap();
            setEditing(false);
            toast.success("Task updated");
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handleDelete = async () => {
        try {
            await deleteTodo(todo.id).unwrap();
            toast.success("Task deleted");
            setConfirmDelete(false);
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    if (editing) {
        return (
            <div className="rounded-xl border border-blue-200 bg-white p-4 shadow-sm space-y-3">
                <Input
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                />
                <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={2}
                    placeholder="Description"
                    className="w-full text-sm text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                        Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveEdit} loading={updating} disabled={!editTitle.trim()}>
                        Save
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div
                className={cn(
                    "group flex items-start gap-3 rounded-xl border bg-white px-4 py-3 shadow-sm transition-all",
                    isCompleted ? "border-slate-200 opacity-75" : "border-slate-200 hover:border-slate-300 hover:shadow-md"
                )}
            >
                <button
                    type="button"
                    onClick={cycleStatus}
                    disabled={updating}
                    className="mt-0.5 shrink-0 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer disabled:opacity-50"
                    title={`Status: ${todo.status.replace("_", " ")} — click to change`}
                    aria-label="Toggle status"
                >
                    {updating ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : todo.status === "in_progress" ? (
                        <Loader2 className="h-5 w-5 text-blue-500" />
                    ) : (
                        <Circle className="h-5 w-5" />
                    )}
                </button>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <p
                            className={cn(
                                "text-sm font-medium text-slate-900",
                                isCompleted && "line-through text-slate-500"
                            )}
                        >
                            {todo.title}
                        </p>
                        <div className="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button
                                type="button"
                                onClick={() => {
                                    setEditTitle(todo.title);
                                    setEditDescription(todo.description ?? "");
                                    setEditing(true);
                                }}
                                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                                aria-label="Edit task"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setConfirmDelete(true)}
                                className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 cursor-pointer"
                                aria-label="Delete task"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>

                    {todo.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{todo.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge variant={PRIORITY_VARIANT[todo.priority]} size="sm">
                            {todo.priority}
                        </Badge>
                        {todo.status === "in_progress" && (
                            <Badge variant="info" size="sm" dot>
                                In progress
                            </Badge>
                        )}
                        {todo.dueDate && (
                            <span
                                className={cn(
                                    "inline-flex items-center gap-1 text-xs font-medium",
                                    hasOverdue ? "text-red-600" : isDueToday ? "text-amber-600" : "text-slate-500"
                                )}
                            >
                                <Calendar className="h-3 w-3" />
                                {format(new Date(todo.dueDate), "MMM d, yyyy")}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirm={handleDelete}
                loading={deleting}
                title="Delete this task?"
                description="This personal task will be permanently removed."
                confirmLabel="Delete"
                variant="danger"
            />
        </>
    );
}
