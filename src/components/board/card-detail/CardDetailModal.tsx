"use client";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useGetBoardMembersQuery } from "@/lib/api/boardApi";
import { useGetCardQuery } from "@/lib/api/cardApi";
import { useGetCommentsQuery } from "@/lib/api/commentApi";
import { useGetProfileQuery } from "@/lib/api/authApi";
import type { Card } from "@/types/card.types";
import { getBoardTheme, BOARD_SCROLLBAR_Y_CLASS, getBoardScrollbarStyle } from "@/lib/boardTheme";
import { cn } from "@/utils/cn";
import type { CardDetailModalProps } from "./types";
import type { CardDetailPopoverKey } from "./popoverTypes";
import { useCardDetailActions } from "./useCardDetailActions";
import CardDetailToolbar from "./CardDetailToolbar";
import CardDetailCover from "./CardDetailCover";
import CardDetailHeader from "./CardDetailHeader";
import CardDetailActionBar from "./CardDetailActionBar";
import CardDetailMain from "./CardDetailMain";
import CardDetailActivity from "./CardDetailActivity";
import CardDetailSkeleton from "./CardDetailSkeleton";
import CardDetailReadOnlyMeta from "./CardDetailReadOnlyMeta";

export default function CardDetailModal(props: CardDetailModalProps) {
    const { open, card } = props;
    if (!open || !card?.id || !card?.listId) return null;
    return <CardDetailModalContent {...props} card={card} />;
}

function CardDetailModalContent({
    open,
    onClose,
    workspaceId,
    boardId,
    boardColor,
    card,
    lists = [],
    readOnly = false,
    onCardUpdate,
    onCardDeleted,
}: CardDetailModalProps & { card: Card }) {
    const theme = getBoardTheme(boardColor);
    const cardId = card.id;
    const propListId = card.listId;
    const skip = !open;
    const [openPopover, setOpenPopover] = useState<CardDetailPopoverKey | null>(null);

    const { data: detailData, isLoading } = useGetCardQuery(
        { workspaceId, boardId, listId: propListId, cardId },
        { skip }
    );
    const { data: commentsData } = useGetCommentsQuery(
        { workspaceId, boardId, cardId },
        { skip }
    );
    const { data: membersData } = useGetBoardMembersQuery(
        { workspaceId, boardId },
        { skip: !open }
    );
    const { data: profileData } = useGetProfileQuery();

    const fetchedCard = detailData ? (detailData as { data: Card }).data : undefined;
    const cardData = fetchedCard ?? card;
    const listId = cardData.listId;
    const comments = commentsData?.data ?? [];
    const commentCount = comments.reduce((n, c) => n + 1 + (c.replies?.length ?? 0), 0);
    const boardMembers = membersData?.data ?? [];
    const me = profileData?.data;

    const actions = useCardDetailActions({
        open,
        workspaceId,
        boardId,
        cardData,
        listId,
        boardMembers,
        meId: me?.id,
        onCardUpdate,
        onCardDeleted,
        onClose,
    });

    const {
        coverInputRef,
        attachmentInputRef,
        handleCoverUpload,
        handleAttachmentUpload,
        confirmDeleteCard,
        setConfirmDeleteCard,
        confirmDeleteCommentId,
        setConfirmDeleteCommentId,
        editingTitle,
        editingDesc,
    } = actions;

    useEffect(() => {
        if (!open || !fetchedCard || !onCardUpdate || !card) return;
        if (fetchedCard.id === card.id && fetchedCard.updatedAt !== card.updatedAt) {
            onCardUpdate(fetchedCard);
        }
    }, [open, fetchedCard, card, onCardUpdate]);

    useEffect(() => {
        if (!open) setOpenPopover(null);
    }, [open]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key !== "Escape" || editingTitle || editingDesc) return;
            if (openPopover) {
                setOpenPopover(null);
                return;
            }
            if (confirmDeleteCard) {
                setConfirmDeleteCard(false);
                return;
            }
            if (confirmDeleteCommentId !== null) {
                setConfirmDeleteCommentId(null);
                return;
            }
            onClose();
        };
        if (open) document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [
        open,
        onClose,
        editingTitle,
        editingDesc,
        openPopover,
        confirmDeleteCard,
        setConfirmDeleteCard,
        confirmDeleteCommentId,
        setConfirmDeleteCommentId,
    ]);

    const currentListName = lists.find((l) => l.id === listId)?.name ?? "List";
    const assigneeIds = (cardData.assignees ?? []).map((a) => String(a.userId));
    const memberOptions = boardMembers.map((m) => ({
        userId: m.userId,
        name: m.user.name,
        avatar: m.user.avatar,
    }));

    const scrollbarStyle = getBoardScrollbarStyle(boardColor);

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                if (!v && !confirmDeleteCard && confirmDeleteCommentId === null && !openPopover) onClose();
            }}
        >
            <DialogContent
                className={cn(
                    "flex flex-col gap-0 p-0 overflow-hidden border border-slate-200 bg-white",
                    "fixed inset-0 max-h-none h-full w-full max-w-none translate-x-0 translate-y-0 rounded-none",
                    "sm:inset-auto sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%]",
                    "sm:h-auto sm:max-h-[92vh] sm:max-w-7xl sm:rounded-xl shadow-2xl"
                )}
                style={{ borderTopColor: theme.boardColor, borderTopWidth: "4px" }}
                onOpenAutoFocus={(e) => e.preventDefault()}
                onPointerDownOutside={(e) => {
                    if (confirmDeleteCard || confirmDeleteCommentId !== null) {
                        e.preventDefault();
                        return;
                    }
                    const target = e.target as HTMLElement;
                    if (
                        target.closest("[role='listbox']") ||
                        target.closest("[role='menu']") ||
                        target.closest("[data-radix-menu-content]") ||
                        target.closest("[data-radix-popper-content-wrapper]")
                    ) {
                        e.preventDefault();
                    }
                }}
                onFocusOutside={(e) => {
                    const target = e.target as HTMLElement;
                    if (
                        target.closest("[role='menu']") ||
                        target.closest("[data-radix-menu-content]") ||
                        target.closest("[data-radix-popper-content-wrapper]")
                    ) {
                        e.preventDefault();
                    }
                }}
            >
                <DialogTitle className="sr-only">{cardData.title}</DialogTitle>
                <DialogDescription className="sr-only">
                    Card details for {cardData.title}
                </DialogDescription>

                <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleCoverUpload}
                />
                <input
                    ref={attachmentInputRef}
                    type="file"
                    accept="image/*,.pdf,.txt,.doc,.docx"
                    className="hidden"
                    onChange={handleAttachmentUpload}
                />

                <CardDetailToolbar
                    card={cardData}
                    listId={listId}
                    lists={lists}
                    currentListName={currentListName}
                    readOnly={readOnly}
                    meId={me?.id}
                    onClose={onClose}
                    onCoverClick={() => coverInputRef.current?.click()}
                    actions={actions}
                />

                <CardDetailCover card={cardData} theme={theme} />

                {isLoading && !detailData ? (
                    <CardDetailSkeleton />
                ) : (
                    <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden transition-opacity duration-200">
                        <div
                            className={cn(
                                "flex-1 min-h-0 overflow-y-auto lg:w-[58%]",
                                BOARD_SCROLLBAR_Y_CLASS
                            )}
                            style={scrollbarStyle}
                        >
                            <div className="p-4 sm:p-6">
                                <CardDetailHeader
                                    card={cardData}
                                    commentCount={commentCount}
                                    readOnly={readOnly}
                                    onEditPriority={!readOnly ? () => setOpenPopover("priority") : undefined}
                                    actions={actions}
                                />

                                {readOnly && (
                                    <CardDetailReadOnlyMeta card={cardData} className="mb-5" />
                                )}

                                {!readOnly && (
                                    <CardDetailActionBar
                                        card={cardData}
                                        theme={theme}
                                        boardColor={boardColor}
                                        boardMembers={memberOptions}
                                        assigneeIds={assigneeIds}
                                        actions={actions}
                                        openPopover={openPopover}
                                        setOpenPopover={setOpenPopover}
                                    />
                                )}

                                <CardDetailMain
                                    card={cardData}
                                    readOnly={readOnly}
                                    accentColor={theme.boardColor}
                                    actions={actions}
                                />

                                <div className="lg:hidden mt-6">
                                    <CardDetailActivity
                                        card={cardData}
                                        comments={comments}
                                        readOnly={readOnly}
                                        meId={me?.id}
                                        meName={me?.name}
                                        meAvatar={me?.avatar}
                                        boardMembers={memberOptions}
                                        accentColor={theme.boardColor}
                                        actions={actions}
                                    />
                                </div>
                            </div>
                        </div>

                        <aside
                            className={cn(
                                "hidden lg:flex lg:flex-col lg:w-[42%]",
                                "min-h-0 border-l border-slate-200 bg-slate-50/40"
                            )}
                        >
                            <div
                                className={cn(
                                    "flex-1 min-h-0 overflow-y-auto p-4 sm:p-6",
                                    BOARD_SCROLLBAR_Y_CLASS
                                )}
                                style={scrollbarStyle}
                            >
                                <CardDetailActivity
                                    card={cardData}
                                    comments={comments}
                                    readOnly={readOnly}
                                    meId={me?.id}
                                    meName={me?.name}
                                    meAvatar={me?.avatar}
                                    boardMembers={memberOptions}
                                    accentColor={theme.boardColor}
                                    actions={actions}
                                    column
                                />
                            </div>
                        </aside>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
