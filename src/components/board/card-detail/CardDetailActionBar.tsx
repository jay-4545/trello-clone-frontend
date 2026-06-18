"use client";
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import {
    Tag,
    Hash,
    Calendar,
    CheckSquare,
    Users,
    Paperclip,
    Flag,
    type LucideIcon,
} from "lucide-react";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import type { Card } from "@/types/card.types";
import type { BoardTheme } from "@/lib/boardTheme";
import { BOARD_SCROLLBAR_X_CLASS, getBoardScrollbarStyle } from "@/lib/boardTheme";
import type { CardDetailActions } from "./useCardDetailActions";
import type { CardDetailPopoverKey } from "./popoverTypes";
import CardDetailPopoverShell from "./CardDetailPopoverShell";
import DatesPopover from "./popovers/DatesPopover";
import ChecklistPopover from "./popovers/ChecklistPopover";
import MembersPopover from "./popovers/MembersPopover";
import LabelsPopover from "./popovers/LabelsPopover";
import TagsPopover from "./popovers/TagsPopover";
import AttachPopover from "./popovers/AttachPopover";
import PriorityPopover from "./popovers/PriorityPopover";
import { cn } from "@/utils/cn";

interface BoardMember {
    userId: number;
    name: string;
    avatar: string | null;
}

interface Props {
    card: Card;
    theme: BoardTheme;
    boardColor: string;
    boardMembers: BoardMember[];
    assigneeIds: string[];
    actions: CardDetailActions;
    openPopover: CardDetailPopoverKey | null;
    setOpenPopover: React.Dispatch<React.SetStateAction<CardDetailPopoverKey | null>>;
}

const PANEL_KEYS = [
    "labels",
    "tags",
    "dates",
    "checklist",
    "members",
    "attachment",
    "priority",
] as const;

type PanelKey = (typeof PANEL_KEYS)[number];

const PANEL_TITLES: Record<PanelKey, string> = {
    labels: "Labels",
    tags: "Tags",
    dates: "Dates",
    checklist: "Add checklist item",
    members: "Members",
    attachment: "Attach",
    priority: "Priority",
};

const ActionPill = forwardRef<
    HTMLButtonElement,
    {
        icon: LucideIcon;
        label: string;
        active?: boolean;
        pillBg: string;
        onClick?: () => void;
    }
>(function ActionPill({ icon: Icon, label, active, pillBg, onClick }, ref) {
    return (
        <button
            ref={ref}
            type="button"
            onClick={onClick}
            style={{ backgroundColor: active ? "#e2e8f0" : pillBg }}
            className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[#172b4d]",
                "hover:brightness-[0.97] active:scale-[0.98] transition-all duration-150 cursor-pointer shrink-0"
            )}
        >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
        </button>
    );
});

function isPanelKey(key: CardDetailPopoverKey | null): key is PanelKey {
    return key !== null && (PANEL_KEYS as readonly string[]).includes(key);
}

export default function CardDetailActionBar({
    card,
    theme,
    boardColor,
    boardMembers,
    assigneeIds,
    actions,
    openPopover,
    setOpenPopover,
}: Props) {
    const pillBg = theme.modalActionPill;
    const scrollbarStyle = getBoardScrollbarStyle(boardColor);
    const pillRefs = useRef<Partial<Record<PanelKey, HTMLButtonElement | null>>>({});
    const panelAnchorElRef = useRef<HTMLElement | null>(null);
    const [panelAnchor, setPanelAnchor] = useState<HTMLElement | null>(null);
    panelAnchorElRef.current = panelAnchor;
    const virtualAnchorRef = useRef({
        getBoundingClientRect: () =>
            panelAnchorElRef.current?.getBoundingClientRect() ?? new DOMRect(0, 0, 0, 0),
    });

    const activePanel = isPanelKey(openPopover) ? openPopover : null;

    useEffect(() => {
        if (openPopover !== "priority") return;
        const anchor = pillRefs.current.priority;
        if (anchor) setPanelAnchor(anchor);
    }, [openPopover]);

    const close = () => setOpenPopover(null);

    const openPanel = useCallback(
        (key: PanelKey, anchor: HTMLElement | null) => {
            if (!anchor) return;
            setPanelAnchor(anchor);
            setOpenPopover((current) => (current === key ? null : key));
        },
        [setOpenPopover]
    );

    const handlePanelOpenChange = useCallback(
        (open: boolean) => {
            if (open) return;
            setOpenPopover((current) => (isPanelKey(current) ? null : current));
        },
        [setOpenPopover]
    );

    const renderPanel = (key: PanelKey) => {
        switch (key) {
            case "labels":
                return <LabelsPopover card={card} actions={actions} />;
            case "tags":
                return <TagsPopover card={card} actions={actions} />;
            case "dates":
                return <DatesPopover card={card} actions={actions} onClose={close} />;
            case "checklist":
                return <ChecklistPopover actions={actions} onClose={close} />;
            case "members":
                return <MembersPopover boardMembers={boardMembers} assigneeIds={assigneeIds} actions={actions} />;
            case "attachment":
                return <AttachPopover actions={actions} onClose={close} />;
            case "priority":
                return <PriorityPopover card={card} actions={actions} />;
            default:
                return null;
        }
    };

    const popoverContentProps = {
        align: "start" as const,
        side: "bottom" as const,
        className: "w-80 p-4 shadow-lg animate-in fade-in-0 zoom-in-95 duration-150",
        style: { borderTopColor: theme.boardColor, borderTopWidth: "3px" },
        onOpenAutoFocus: (e: Event) => e.preventDefault(),
        onCloseAutoFocus: (e: Event) => e.preventDefault(),
    };

    const pills: { key: PanelKey; icon: LucideIcon; label: string }[] = [
        { key: "labels", icon: Tag, label: "Labels" },
        { key: "tags", icon: Hash, label: "Tags" },
        { key: "dates", icon: Calendar, label: "Dates" },
        { key: "checklist", icon: CheckSquare, label: "Checklist" },
        { key: "members", icon: Users, label: "Members" },
        { key: "attachment", icon: Paperclip, label: "Attachment" },
        { key: "priority", icon: Flag, label: "Priority" },
    ];

    return (
        <div
            className={cn("flex gap-2 overflow-x-auto pb-1 mb-5 -mx-1 px-1", BOARD_SCROLLBAR_X_CLASS)}
            style={scrollbarStyle}
        >
            <div className="flex gap-2 min-w-max">
                {pills.map(({ key, icon, label }) => (
                    <ActionPill
                        key={key}
                        ref={(el) => {
                            pillRefs.current[key] = el;
                        }}
                        icon={icon}
                        label={label}
                        pillBg={pillBg}
                        active={openPopover === key}
                        onClick={() => openPanel(key, pillRefs.current[key] ?? null)}
                    />
                ))}

                {activePanel && panelAnchor && (
                    <Popover modal={false} open onOpenChange={handlePanelOpenChange}>
                        <PopoverAnchor virtualRef={virtualAnchorRef} />
                        <PopoverContent {...popoverContentProps}>
                            <CardDetailPopoverShell title={PANEL_TITLES[activePanel]}>
                                {renderPanel(activePanel)}
                            </CardDetailPopoverShell>
                        </PopoverContent>
                    </Popover>
                )}
            </div>
        </div>
    );
}
