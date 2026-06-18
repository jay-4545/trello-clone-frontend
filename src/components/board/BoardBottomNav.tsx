"use client";
import { Columns3, LayoutGrid } from "lucide-react";
import { cn } from "@/utils/cn";

interface Props {
    boardName: string;
    boardColor: string;
    hidden?: boolean;
    onSwitchBoard: () => void;
    // kept for caller compatibility
    workspaceId?: number;
    boardId?: number;
    workspaceName?: string;
    unreadCount?: number;
    canEditBoard?: boolean;
    canManageBoard?: boolean;
    onAddList?: () => void;
    onOpenMembers?: () => void;
    onOpenSettings?: () => void;
    onOpenArchived?: () => void;
    profileHref?: string;
}

/** Floating bottom bar — matches board canvas + toolbar styling. */
export default function BoardBottomNav({
    boardName,
    boardColor,
    hidden = false,
    onSwitchBoard,
}: Props) {
    if (hidden) return null;

    return (
        <div
            className="fixed bottom-4 left-0 right-0 z-40 flex justify-center pointer-events-none safe-area-pb pb-4"
            aria-label="Board navigation"
        >
            <div
                className={cn(
                    "pointer-events-auto flex items-center gap-1",
                    "h-12 pl-1 pr-1.5 rounded-full",
                    "bg-black/35 backdrop-blur-md",
                    "border border-white/20",
                    "shadow-[0_4px_24px_rgba(0,0,0,0.25)]"
                )}
            >
                {/* Current board */}
                <div
                    className="relative flex items-center gap-2 h-10 px-3.5 rounded-full text-white"
                    style={{ backgroundColor: boardColor }}
                    title={boardName}
                >
                    <Columns3 className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2.25} />
                    <span className="text-sm font-semibold whitespace-nowrap max-w-[100px] truncate sm:max-w-[140px]">
                        {boardName}
                    </span>
                    <span
                        className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full bg-white/90"
                        aria-hidden
                    />
                </div>

                <div className="w-px h-5 bg-white/25 shrink-0" />

                {/* Switch boards */}
                <button
                    type="button"
                    onClick={onSwitchBoard}
                    className={cn(
                        "flex items-center gap-2 h-10 px-3.5 rounded-full",
                        "text-white/90 hover:text-white hover:bg-white/10",
                        "transition-colors cursor-pointer"
                    )}
                >
                    <LayoutGrid className="h-4 w-4 shrink-0" strokeWidth={2} />
                    <span className="text-sm font-medium whitespace-nowrap">Switch boards</span>
                </button>
            </div>
        </div>
    );
}

/** Height reserved at bottom of board canvas. */
export const BOARD_BOTTOM_NAV_HEIGHT = "4rem";
