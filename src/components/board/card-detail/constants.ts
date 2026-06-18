import type { CardPriority, CardStatus } from "@/types/card.types";

export const PRIORITIES: { value: CardPriority; label: string; color: string }[] = [
    { value: "critical", label: "Critical", color: "bg-red-100 text-red-700 border-red-300" },
    { value: "high", label: "High", color: "bg-orange-100 text-orange-700 border-orange-300" },
    { value: "medium", label: "Medium", color: "bg-blue-100 text-blue-700 border-blue-300" },
    { value: "low", label: "Low", color: "bg-slate-100 text-slate-600 border-slate-300" },
];

export const STATUSES: { value: CardStatus; label: string }[] = [
    { value: "open", label: "Open" },
    { value: "in_progress", label: "In Progress" },
    { value: "in_review", label: "In Review" },
    { value: "done", label: "Done" },
];

export const STATUS_OPTIONS = STATUSES.map((s) => ({ value: s.value, label: s.label }));
export const PRIORITY_OPTIONS = PRIORITIES.map((p) => ({ value: p.value, label: p.label }));

export const LABEL_COLORS = [
    "bg-emerald-500", "bg-blue-500", "bg-amber-500", "bg-rose-500",
    "bg-violet-500", "bg-pink-500", "bg-cyan-500", "bg-orange-500",
];
