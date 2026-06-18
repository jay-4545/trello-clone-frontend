"use client";
import { useState } from "react";
import { Search } from "lucide-react";
import Input from "@/components/ui/Input";
import TodoStatsBar from "@/components/todo/TodoStatsBar";
import TodoList from "@/components/todo/TodoList";
import type { TodoPriority, TodoStatus } from "@/lib/api/todoApi";
import { cn } from "@/utils/cn";

const PRIORITY_FILTERS: { value: TodoPriority | null; label: string }[] = [
    { value: null, label: "All priorities" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
];

export default function TodosPage() {
    const [statusFilter, setStatusFilter] = useState<TodoStatus | null>(null);
    const [priorityFilter, setPriorityFilter] = useState<TodoPriority | null>(null);
    const [search, setSearch] = useState("");

    return (
        <div className="min-h-full bg-[#f0f2f5]">
            <div className="sticky top-14 lg:top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 space-y-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                            My Tasks
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Personal to-dos — separate from your board cards
                        </p>
                    </div>
                    <TodoStatsBar
                        activeStatus={statusFilter}
                        onStatusClick={(s) => setStatusFilter(s as TodoStatus | null)}
                    />
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                        <Input
                            placeholder="Search tasks…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            leftElement={<Search className="h-3.5 w-3.5" />}
                        />
                    </div>
                    <div className="flex items-center gap-1 border border-slate-200 rounded-lg overflow-hidden bg-white shrink-0">
                        {PRIORITY_FILTERS.map((p) => (
                            <button
                                key={p.label}
                                type="button"
                                onClick={() => setPriorityFilter(p.value)}
                                className={cn(
                                    "px-3 py-2 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap",
                                    priorityFilter === p.value
                                        ? "bg-blue-50 text-blue-700"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                                )}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                <TodoList
                    status={statusFilter ?? undefined}
                    priority={priorityFilter ?? undefined}
                    search={search}
                />
            </div>
        </div>
    );
}
