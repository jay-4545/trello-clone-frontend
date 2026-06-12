"use client";
import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2 } from "lucide-react";

import { useSearchCardsQuery } from "@/lib/api/cardApi";
import type { Card } from "@/types/card.types";
import { cn } from "@/utils/cn";

interface Props {
    workspaceId: number;
    boardId: number;
    onSelectCard: (card: Card) => void;
}

export default function BoardSearchBar({ workspaceId, boardId, onSelectCard }: Props) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [debouncedQ, setDebouncedQ] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQ(query.trim()), 300);
        return () => clearTimeout(timer);
    }, [query]);

    const { data, isFetching } = useSearchCardsQuery(
        { workspaceId, boardId, q: debouncedQ },
        { skip: !open || debouncedQ.length < 2 }
    );

    const results = data?.data ?? [];

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div ref={containerRef} className="relative">
            <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium px-3 py-1.5 rounded transition-colors"
            >
                <Search className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Search</span>
            </button>

            {open && (
                <div className="absolute right-0 top-10 z-50 w-72 sm:w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
                        <Search className="h-4 w-4 text-slate-400 shrink-0" />
                        <input
                            autoFocus
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search cards…"
                            className="flex-1 text-sm text-slate-900 focus:outline-none"
                        />
                        {query && (
                            <button onClick={() => setQuery("")} className="text-slate-400 hover:text-slate-600">
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {debouncedQ.length < 2 ? (
                            <p className="text-xs text-slate-400 p-3">Type at least 2 characters</p>
                        ) : isFetching ? (
                            <div className="flex justify-center py-6">
                                <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
                            </div>
                        ) : results.length === 0 ? (
                            <p className="text-xs text-slate-400 p-3">No cards found</p>
                        ) : (
                            results.map((card) => (
                                <button
                                    key={card.id}
                                    onClick={() => {
                                        onSelectCard(card);
                                        setOpen(false);
                                        setQuery("");
                                    }}
                                    className={cn(
                                        "w-full text-left px-3 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-0"
                                    )}
                                >
                                    <p className="text-sm font-medium text-slate-900 truncate">{card.title}</p>
                                    {card.description && (
                                        <p className="text-xs text-slate-500 truncate mt-0.5">{card.description}</p>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
