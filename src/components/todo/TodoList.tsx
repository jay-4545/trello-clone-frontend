"use client";
import { useGetTodosQuery } from "@/lib/api/todoApi";
import type { TodoPriority, TodoStatus } from "@/lib/api/todoApi";
import { Skeleton } from "@/components/ui";
import EmptyState from "@/components/ui/EmptyState";
import ErrorMessage from "@/components/ui/ErrorMessage";
import TodoItem from "./TodoItem";
import CreateTodoForm from "./CreateTodoForm";
import { CheckSquare } from "lucide-react";

interface Props {
    status?: TodoStatus;
    priority?: TodoPriority;
    search?: string;
}

export default function TodoList({ status, priority, search }: Props) {
    const { data, isLoading, isError, refetch } = useGetTodosQuery({
        status,
        priority,
        search: search || undefined,
        limit: 100,
    });

    const todos = data?.data ?? [];

    return (
        <div className="space-y-3">
            <CreateTodoForm />

            {isLoading && (
                <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full rounded-xl" />
                    ))}
                </div>
            )}

            {isError && (
                <ErrorMessage message="Failed to load tasks." onRetry={refetch} />
            )}

            {!isLoading && !isError && todos.length === 0 && (
                <EmptyState
                    icon={<CheckSquare className="h-6 w-6" />}
                    title={search ? "No tasks match your search" : "No tasks yet"}
                    description={
                        search
                            ? "Try a different search term or clear filters."
                            : "Add a personal task above to get started."
                    }
                />
            )}

            {!isLoading && !isError && todos.length > 0 && (
                <div className="space-y-2">
                    {todos.map((todo) => (
                        <TodoItem key={todo.id} todo={todo} />
                    ))}
                </div>
            )}
        </div>
    );
}
