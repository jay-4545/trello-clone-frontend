"use client";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Star,
    X,
    Search,
    Clock,
    LayoutGrid,
    ChevronRight,
    Lock,
    Globe,
} from "lucide-react";
import { useGetBoardsQuery } from "@/lib/api/boardApi";
import type { Board } from "@/lib/api/boardApi";
import { getBoardColor } from "@/lib/boardColors";
import { mixWithWhite } from "@/lib/boardTheme";
import { cn } from "@/utils/cn";

interface Props {
    open: boolean;
    onClose: () => void;
    workspaceId: number;
    currentBoardId: number;
    boardColor: string;
    workspaceName?: string;
}

export default function BoardSwitcherSheet({
    open,
    onClose,
    workspaceId,
    currentBoardId,
    boardColor,
    workspaceName,
}: Props) {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const { data, isLoading } = useGetBoardsQuery(workspaceId, { skip: !open });

    useEffect(() => {
        if (!open) setSearch("");
    }, [open]);

    useEffect(() => {
        if (!open) return;
        document.body.style.overflow = "hidden";
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = "";
            document.removeEventListener("keydown", onKey);
        };
    }, [open, onClose]);

    const boards = useMemo(
        () => (data?.data ?? []).filter((b) => !b.isClosed),
        [data?.data]
    );

    const currentBoard = boards.find((b) => b.id === currentBoardId);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return boards;
        return boards.filter(
            (b) =>
                b.name.toLowerCase().includes(q) ||
                b.description?.toLowerCase().includes(q)
        );
    }, [boards, search]);

    const starred = useMemo(
        () => filtered.filter((b) => b.isStarred),
        [filtered]
    );

    const others = useMemo(
        () =>
            filtered
                .filter((b) => !b.isStarred)
                .sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                ),
        [filtered]
    );

    const navigate = (boardId: number) => {
        if (boardId === currentBoardId) {
            onClose();
            return;
        }
        router.push(`/workspaces/${workspaceId}/boards/${boardId}`);
        onClose();
    };

    if (!open || typeof document === "undefined") return null;

    const headerTint = mixWithWhite(boardColor, 0.12);

    return createPortal(
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-6">
            <button
                type="button"
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-200"
                onClick={onClose}
                aria-label="Close board switcher"
            />

            <div
                className={cn(
                    "relative w-full sm:max-w-2xl flex flex-col",
                    "bg-white text-slate-900",
                    "rounded-t-2xl sm:rounded-2xl",
                    "max-h-[92vh] sm:max-h-[88vh]",
                    "shadow-2xl overflow-hidden",
                    "animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 fade-in-0 duration-200"
                )}
                role="dialog"
                aria-modal="true"
                aria-labelledby="board-switcher-title"
            >
                {/* Colored header */}
                <div
                    className="shrink-0 px-4 sm:px-6 pt-4 pb-4 border-b border-slate-200/80"
                    style={{
                        background: `linear-gradient(135deg, ${headerTint} 0%, #ffffff 72%)`,
                    }}
                >
                    <div className="sm:hidden flex justify-center pb-3">
                        <div className="h-1 w-10 rounded-full bg-slate-300/80" />
                    </div>

                    <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <div
                                    className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
                                    style={{ backgroundColor: boardColor }}
                                >
                                    <LayoutGrid className="h-4 w-4 text-white" />
                                </div>
                                <h2
                                    id="board-switcher-title"
                                    className="text-lg font-semibold text-slate-900"
                                >
                                    Switch boards
                                </h2>
                            </div>
                            <p className="text-xs text-slate-500 pl-10">
                                {workspaceName && (
                                    <span className="truncate">{workspaceName}</span>
                                )}
                                {workspaceName && boards.length > 0 && (
                                    <span className="mx-1.5 text-slate-300">·</span>
                                )}
                                {boards.length > 0 && (
                                    <span>
                                        {boards.length} board{boards.length !== 1 ? "s" : ""}
                                    </span>
                                )}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/80 border border-slate-200 text-slate-500 hover:bg-white hover:text-slate-700 cursor-pointer shrink-0 shadow-sm"
                            aria-label="Close"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search your boards"
                            className={cn(
                                "w-full h-11 pl-10 pr-10 text-sm rounded-xl border bg-white/90 backdrop-blur-sm",
                                "text-slate-900 placeholder:text-slate-400",
                                "border-slate-200 hover:border-slate-300",
                                "focus:outline-none focus:ring-2 focus:border-transparent shadow-sm",
                                "focus:ring-blue-500/40 focus:border-blue-400"
                            )}
                            autoFocus
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                                aria-label="Clear search"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>

                    {search && filtered.length > 0 && (
                        <p className="text-xs text-slate-500 mt-2 pl-1">
                            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                        </p>
                    )}
                </div>

                {/* Board list */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 min-h-0 bg-slate-50/60">
                    {isLoading && <BoardGridSkeleton />}

                    {!isLoading && filtered.length === 0 && (
                        <EmptyState hasSearch={!!search.trim()} />
                    )}

                    {!isLoading && starred.length > 0 && (
                        <BoardSection
                            title="Starred"
                            icon={<Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                            boards={starred}
                            currentBoardId={currentBoardId}
                            onSelect={navigate}
                        />
                    )}

                    {!isLoading && others.length > 0 && (
                        <BoardSection
                            title={starred.length > 0 ? "Recent" : "All boards"}
                            icon={<Clock className="h-3.5 w-3.5 text-slate-400" />}
                            boards={others}
                            currentBoardId={currentBoardId}
                            onSelect={navigate}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="shrink-0 px-4 sm:px-6 py-3.5 border-t border-slate-200 bg-white">
                    <Link
                        href={`/workspaces/${workspaceId}`}
                        onClick={onClose}
                        className="flex items-center justify-between gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors group"
                    >
                        <span className="truncate">
                            {workspaceName ? `All boards in ${workspaceName}` : "View workspace"}
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </div>
            </div>
        </div>,
        document.body
    );
}

function BoardSection({
    title,
    icon,
    boards,
    currentBoardId,
    onSelect,
}: {
    title: string;
    icon: React.ReactNode;
    boards: Board[];
    currentBoardId: number;
    onSelect: (id: number) => void;
}) {
    return (
        <section className="mb-6 last:mb-0">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                {icon}
                {title}
                <span className="font-normal normal-case tracking-normal text-slate-400">
                    ({boards.length})
                </span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {boards.map((board) => (
                    <BoardCard
                        key={board.id}
                        board={board}
                        isActive={board.id === currentBoardId}
                        onSelect={() => onSelect(board.id)}
                    />
                ))}
            </div>
        </section>
    );
}

function BoardCard({
    board,
    isActive,
    onSelect,
}: {
    board: Board;
    isActive: boolean;
    onSelect: () => void;
}) {
    const color = getBoardColor(board.background, board.id);

    return (
        <button
            type="button"
            onClick={onSelect}
            className={cn(
                "group text-left rounded-xl overflow-hidden bg-white",
                "border border-slate-200/80 shadow-sm",
                "hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5",
                "transition-all duration-150 cursor-pointer"
            )}
            style={
                isActive
                    ? {
                          boxShadow: `0 0 0 2px #fff, 0 0 0 4px ${color}, 0 4px 12px rgba(0,0,0,0.12)`,
                      }
                    : undefined
            }
        >
            <div
                className="relative h-[72px] sm:h-[80px]"
                style={{ backgroundColor: color }}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-black/10" />

                <div className="relative z-10 flex items-start justify-between p-2">
                    <VisibilityBadge visibility={board.visibility} />
                    {board.isStarred && (
                        <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300 drop-shadow shrink-0" />
                    )}
                </div>

                {isActive && (
                    <span className="absolute bottom-2 left-2 z-10 text-[9px] font-bold uppercase tracking-wide bg-white/90 text-slate-700 px-1.5 py-0.5 rounded shadow-sm">
                        Open
                    </span>
                )}
            </div>

            <div className="px-2.5 py-2 bg-white group-hover:bg-slate-50/80 transition-colors">
                <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate leading-tight">
                    {board.name}
                </p>
                {board.description && (
                    <p className="text-[10px] text-slate-400 truncate mt-0.5 hidden sm:block">
                        {board.description}
                    </p>
                )}
            </div>
        </button>
    );
}

function VisibilityBadge({ visibility }: { visibility: Board["visibility"] }) {
    if (visibility === "workspace") return null;

    const Icon = visibility === "private" ? Lock : Globe;
    const label = visibility === "private" ? "Private" : "Public";

    return (
        <div className="flex items-center gap-0.5 bg-black/25 backdrop-blur-sm rounded px-1.5 py-0.5">
            <Icon className="h-2.5 w-2.5 text-white/90" />
            <span className="text-[9px] text-white/90 font-medium">{label}</span>
        </div>
    );
}

function BoardGridSkeleton() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-xl overflow-hidden border border-slate-100">
                    <div className="h-[72px] sm:h-[80px] bg-slate-200 animate-pulse" />
                    <div className="h-10 bg-slate-100 animate-pulse" />
                </div>
            ))}
        </div>
    );
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
    return (
        <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
            <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                {hasSearch ? (
                    <Search className="h-6 w-6 text-slate-400" />
                ) : (
                    <LayoutGrid className="h-6 w-6 text-slate-400" />
                )}
            </div>
            <p className="text-sm font-medium text-slate-700 mb-1">
                {hasSearch ? "No boards found" : "No boards yet"}
            </p>
            <p className="text-xs text-slate-500 max-w-[240px]">
                {hasSearch
                    ? "Try a different search term or clear the filter."
                    : "Create a board from your workspace to get started."}
            </p>
        </div>
    );
}
