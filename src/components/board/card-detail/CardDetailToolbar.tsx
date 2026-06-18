"use client";
import { forwardRef } from "react";
import {
    ChevronDown,
    ImagePlus,
    MoreHorizontal,
    X,
    Share2,
    Archive,
    Trash2,
    UserPlus,
    ArrowRight,
    Copy,
    Layers,
    LayoutTemplate,
    Eye,
    Check,
} from "lucide-react";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui";
import type { Card } from "@/types/card.types";
import type { BoardListOption } from "./types";
import type { CardDetailActions } from "./useCardDetailActions";
import { cn } from "@/utils/cn";

interface Props {
    card: Card;
    listId: number;
    lists: BoardListOption[];
    currentListName: string;
    readOnly: boolean;
    meId?: number;
    onClose: () => void;
    onCoverClick: () => void;
    actions: CardDetailActions;
}

const ToolbarIcon = forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & {
        active?: boolean;
        label: string;
    }
>(function ToolbarIcon({ active, label, children, disabled, className, type = "button", ...rest }, ref) {
    return (
        <button
            ref={ref}
            type={type}
            disabled={disabled}
            aria-label={label}
            className={cn(
                "flex items-center justify-center h-8 w-8 rounded-lg transition-colors cursor-pointer",
                active ? "bg-blue-600 text-white hover:bg-blue-700" : "text-slate-600 hover:bg-slate-100",
                disabled && "opacity-50 cursor-not-allowed",
                className
            )}
            {...rest}
        >
            {children}
        </button>
    );
});

export default function CardDetailToolbar({
    card,
    listId,
    lists,
    currentListName,
    readOnly,
    meId,
    onClose,
    onCoverClick,
    actions,
}: Props) {
    const {
        handleMoveList,
        handleToggleWatch,
        togglingWatch,
        handleCopyLink,
        handleJoin,
        handleCopyCard,
        handleArchive,
        confirmDeleteCard,
        setConfirmDeleteCard,
        handleDelete,
        deleting,
        copyingCard,
    } = actions;

    const isJoined = meId != null && (card.assignees ?? []).some((a) => a.userId === meId);

    return (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-slate-200 shrink-0 bg-white">
            <div className="min-w-0">
                {lists.length > 0 && !readOnly ? (
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#172b4d] bg-slate-100 hover:bg-slate-200 rounded-lg px-3 py-1.5 cursor-pointer outline-none transition-colors"
                            >
                                {currentListName}
                                <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="min-w-[200px] z-[10050]">
                            {lists.map((l) => (
                                <DropdownMenuItem
                                    key={l.id}
                                    onSelect={() => handleMoveList(l.id)}
                                    className={cn(l.id === listId && "text-blue-600 font-medium")}
                                >
                                    {l.name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <span className="text-sm font-semibold text-[#172b4d] px-1">{currentListName}</span>
                )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
                {!readOnly && (
                    <ToolbarIcon onClick={onCoverClick} label="Add cover">
                        <ImagePlus className="h-4 w-4" />
                    </ToolbarIcon>
                )}

                {!readOnly && (
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <ToolbarIcon label="Card actions">
                                <MoreHorizontal className="h-4 w-4" />
                            </ToolbarIcon>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="z-[10050] w-56"
                            onCloseAutoFocus={(e) => e.preventDefault()}
                        >
                            {meId != null && !isJoined && (
                                <DropdownMenuItem onSelect={handleJoin}>
                                    <UserPlus className="h-4 w-4" />
                                    Join
                                </DropdownMenuItem>
                            )}

                            {lists.length > 0 && (
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>
                                        <ArrowRight className="h-4 w-4" />
                                        Move
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent className="z-[10050]">
                                        {lists.map((l) => (
                                            <DropdownMenuItem
                                                key={l.id}
                                                onSelect={() => handleMoveList(l.id)}
                                                className={cn(l.id === listId && "text-blue-600 font-medium")}
                                            >
                                                {l.name}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub>
                            )}

                            <DropdownMenuItem onSelect={handleCopyCard} disabled={copyingCard}>
                                <Copy className="h-4 w-4" />
                                {copyingCard ? "Copying…" : "Copy"}
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onSelect={() => toast.info("Mirror cards coming soon")}
                            >
                                <Layers className="h-4 w-4" />
                                Mirror
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onSelect={() => toast.info("Card templates coming soon")}
                            >
                                <LayoutTemplate className="h-4 w-4" />
                                Make template
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onSelect={handleToggleWatch}
                                disabled={togglingWatch}
                                className="justify-between"
                            >
                                <span className="inline-flex items-center gap-2">
                                    <Eye className="h-4 w-4" />
                                    Watch
                                </span>
                                {card.isWatched && (
                                    <span className="inline-flex items-center justify-center h-5 w-5 rounded bg-emerald-500 text-white">
                                        <Check className="h-3 w-3" strokeWidth={3} />
                                    </span>
                                )}
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem onSelect={handleCopyLink}>
                                <Share2 className="h-4 w-4" />
                                Share
                            </DropdownMenuItem>

                            <DropdownMenuItem onSelect={handleArchive}>
                                <Archive className="h-4 w-4" />
                                Archive
                            </DropdownMenuItem>

                            {!confirmDeleteCard ? (
                                <DropdownMenuItem
                                    onSelect={() => setConfirmDeleteCard(true)}
                                    className="text-red-600 focus:text-red-600"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            ) : (
                                <div className="px-2 py-2 space-y-2">
                                    <p className="text-xs text-red-700 font-medium px-1">Delete permanently?</p>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setConfirmDeleteCard(false)}
                                            disabled={deleting}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="danger"
                                            onClick={handleDelete}
                                            loading={deleting}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}

                <ToolbarIcon onClick={onClose} label="Close">
                    <X className="h-4 w-4" />
                </ToolbarIcon>
            </div>
        </div>
    );
}
