"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import type { Card } from "@/types/card.types";
import { parseApiError } from "@/utils/errorParser";
import { emitCardTyping, connectSocket } from "@/lib/socket/socketClient";
import {
    useUpdateCardMutation,
    useCreateCardMutation,
    useDeleteCardMutation,
    useArchiveCardMutation,
    useAddChecklistItemMutation,
    useUpdateChecklistItemMutation,
    useDeleteChecklistItemMutation,
    useAssignUserMutation,
    useUnassignUserMutation,
    useUploadCoverImageMutation,
    useUploadAttachmentMutation,
    useDeleteAttachmentMutation,
    useToggleWatchMutation,
    useMoveCardMutation,
} from "@/lib/api/cardApi";
import {
    useCreateCommentMutation,
    useDeleteCommentMutation,
    useUpdateCommentMutation,
} from "@/lib/api/commentApi";

interface UseCardDetailActionsParams {
    open: boolean;
    workspaceId: number;
    boardId: number;
    cardData: Card;
    listId: number;
    boardMembers: { userId: number; user: { name: string } }[];
    meId?: number;
    onCardUpdate?: (card: Card) => void;
    onCardDeleted?: (cardId: number) => void;
    onClose: () => void;
}

export function useCardDetailActions({
    open,
    workspaceId,
    boardId,
    cardData,
    listId,
    boardMembers,
    meId,
    onCardUpdate,
    onCardDeleted,
    onClose,
}: UseCardDetailActionsParams) {
    const [updateCard, { isLoading: updating }] = useUpdateCardMutation();
    const [createCard, { isLoading: copyingCard }] = useCreateCardMutation();
    const [deleteCard, { isLoading: deleting }] = useDeleteCardMutation();
    const [archiveCard] = useArchiveCardMutation();
    const [addChecklistItem] = useAddChecklistItemMutation();
    const [updateChecklistItem] = useUpdateChecklistItemMutation();
    const [deleteChecklistItem] = useDeleteChecklistItemMutation();
    const [assignUser] = useAssignUserMutation();
    const [unassignUser] = useUnassignUserMutation();
    const [createComment, { isLoading: postingComment }] = useCreateCommentMutation();
    const [deleteComment] = useDeleteCommentMutation();
    const [updateComment] = useUpdateCommentMutation();
    const [uploadCover, { isLoading: uploadingCover }] = useUploadCoverImageMutation();
    const [uploadAttachment, { isLoading: uploadingAttachment }] = useUploadAttachmentMutation();
    const [deleteAttachment] = useDeleteAttachmentMutation();
    const [toggleWatch, { isLoading: togglingWatch }] = useToggleWatchMutation();
    const [moveCard] = useMoveCardMutation();

    const coverInputRef = useRef<HTMLInputElement>(null);
    const attachmentInputRef = useRef<HTMLInputElement>(null);

    const [editingTitle, setEditingTitle] = useState(false);
    const [titleValue, setTitleValue] = useState("");
    const [editingDesc, setEditingDesc] = useState(false);
    const [descValue, setDescValue] = useState("");
    const [newChecklistItem, setNewChecklistItem] = useState("");
    const [labelInput, setLabelInput] = useState("");
    const [tagInput, setTagInput] = useState("");
    const [estimateValue, setEstimateValue] = useState("");
    const [commentInput, setCommentInput] = useState("");
    const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
    const [editingCommentText, setEditingCommentText] = useState("");
    const [hideActivityDetails, setHideActivityDetails] = useState(false);
    const [confirmDeleteCard, setConfirmDeleteCard] = useState(false);
    const [confirmDeleteCommentId, setConfirmDeleteCommentId] = useState<number | null>(null);
    const [replyToComment, setReplyToComment] = useState<{ id: number; name: string } | null>(null);
    const [typingUsers, setTypingUsers] = useState<Record<number, string>>({});
    const [savingField, setSavingField] = useState<"title" | "description" | null>(null);
    const typingTimeoutRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
    const emitTypingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        setTitleValue(cardData.title);
        setDescValue(cardData.description ?? "");
        setEstimateValue(cardData.estimateHours != null ? String(cardData.estimateHours) : "");
    }, [cardData]);

    useEffect(() => {
        if (!open) {
            setReplyToComment(null);
            setCommentInput("");
            setConfirmDeleteCard(false);
            setConfirmDeleteCommentId(null);
            setEditingTitle(false);
            setEditingDesc(false);
            setSavingField(null);
        }
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const socket = connectSocket();
        if (!socket) return;

        const handleTyping = ({ userId, cardId: typingCardId }: { userId: number; cardId: number }) => {
            if (typingCardId !== cardData.id || userId === meId) return;
            const member = boardMembers.find((m) => m.userId === userId);
            const name = member?.user.name ?? "Someone";
            setTypingUsers((prev) => ({ ...prev, [userId]: name }));
            if (typingTimeoutRef.current[userId]) clearTimeout(typingTimeoutRef.current[userId]);
            typingTimeoutRef.current[userId] = setTimeout(() => {
                setTypingUsers((prev) => {
                    const next = { ...prev };
                    delete next[userId];
                    return next;
                });
            }, 3000);
        };

        socket.on("card:typing", handleTyping);
        return () => {
            socket.off("card:typing", handleTyping);
            Object.values(typingTimeoutRef.current).forEach(clearTimeout);
            typingTimeoutRef.current = {};
            setTypingUsers({});
        };
    }, [open, cardData.id, meId, boardMembers]);

    const updateField = useCallback(async (body: Record<string, unknown>) => {
        try {
            const res = await updateCard({
                workspaceId, boardId, listId, cardId: cardData.id, body,
            }).unwrap();
            const updated = (res as { data?: Card }).data;
            if (updated) onCardUpdate?.(updated);
        } catch (err) {
            toast.error(parseApiError(err));
        }
    }, [updateCard, workspaceId, boardId, listId, cardData.id, onCardUpdate]);

    const handleSaveTitle = async () => {
        const title = titleValue.trim();
        if (!title || title === cardData.title) {
            setEditingTitle(false);
            setTitleValue(cardData.title);
            return;
        }
        try {
            setSavingField("title");
            const res = await updateCard({
                workspaceId, boardId, listId, cardId: cardData.id, body: { title },
            }).unwrap();
            setEditingTitle(false);
            const updated = (res as { data?: Card }).data;
            if (updated) onCardUpdate?.(updated);
        } catch (err) {
            toast.error(parseApiError(err));
        } finally {
            setSavingField(null);
        }
    };

    const handleSaveDescription = async () => {
        const description = descValue.trim();
        if (description === (cardData.description ?? "")) {
            setEditingDesc(false);
            return;
        }
        try {
            setSavingField("description");
            const res = await updateCard({
                workspaceId, boardId, listId, cardId: cardData.id,
                body: { description: description || null },
            }).unwrap();
            setEditingDesc(false);
            const updated = (res as { data?: Card }).data;
            if (updated) onCardUpdate?.(updated);
        } catch (err) {
            toast.error(parseApiError(err));
        } finally {
            setSavingField(null);
        }
    };

    const handleToggleComplete = () => {
        const next = cardData.status === "done" ? "open" : "done";
        updateField({ status: next });
    };

    const handleAddLabel = async () => {
        const t = labelInput.trim();
        if (!t) return;
        const current = cardData.labels ?? [];
        if (current.includes(t)) { setLabelInput(""); return; }
        await updateField({ labels: [...current, t] });
        setLabelInput("");
    };

    const handleRemoveLabel = (label: string) => {
        updateField({ labels: (cardData.labels ?? []).filter((l) => l !== label) });
    };

    const handleAddTag = async () => {
        const t = tagInput.trim();
        if (!t) return;
        const current = cardData.tags ?? [];
        if (current.includes(t)) { setTagInput(""); return; }
        await updateField({ tags: [...current, t] });
        setTagInput("");
    };

    const handleRemoveTag = (tag: string) => {
        updateField({ tags: (cardData.tags ?? []).filter((t) => t !== tag) });
    };

    const handleAddChecklist = async () => {
        const text = newChecklistItem.trim();
        if (!text) return;
        try {
            await addChecklistItem({ workspaceId, boardId, listId, cardId: cardData.id, text }).unwrap();
            setNewChecklistItem("");
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handleToggleChecklistItem = async (itemId: string, completed: boolean) => {
        try {
            await updateChecklistItem({ workspaceId, boardId, listId, cardId: cardData.id, itemId, completed }).unwrap();
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handleDeleteChecklistItem = async (itemId: string) => {
        try {
            await deleteChecklistItem({ workspaceId, boardId, listId, cardId: cardData.id, itemId }).unwrap();
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handleAssigneesChange = async (ids: string[]) => {
        const currentIds = (cardData.assignees ?? []).map((a) => String(a.userId));
        const prev = new Set(currentIds);
        const next = new Set(ids);
        try {
            for (const id of ids) {
                if (!prev.has(id)) {
                    await assignUser({ workspaceId, boardId, listId, cardId: cardData.id, userId: Number(id) }).unwrap();
                }
            }
            for (const id of currentIds) {
                if (!next.has(id)) {
                    await unassignUser({ workspaceId, boardId, listId, cardId: cardData.id, userId: Number(id) }).unwrap();
                }
            }
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handlePostComment = async () => {
        const content = commentInput.trim();
        if (!content) return;
        try {
            await createComment({
                workspaceId, boardId, cardId: cardData.id, content, parentId: replyToComment?.id,
            }).unwrap();
            setCommentInput("");
            setReplyToComment(null);
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handleCommentTyping = () => {
        if (emitTypingRef.current) clearTimeout(emitTypingRef.current);
        emitTypingRef.current = setTimeout(() => emitCardTyping(boardId, cardData.id), 400);
    };

    const handleDeleteComment = async (commentId: number) => {
        try {
            await deleteComment({ workspaceId, boardId, cardId: cardData.id, commentId }).unwrap();
            setConfirmDeleteCommentId(null);
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handleSaveComment = async () => {
        if (!editingCommentId) return;
        const content = editingCommentText.trim();
        if (!content) return;
        try {
            await updateComment({
                workspaceId, boardId, cardId: cardData.id, commentId: editingCommentId, content,
            }).unwrap();
            setEditingCommentId(null);
            setEditingCommentText("");
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5 MB"); return; }
        const formData = new FormData();
        formData.append("cover", file);
        try {
            await uploadCover({ workspaceId, boardId, listId, cardId: cardData.id, file: formData }).unwrap();
            toast.success("Cover updated");
        } catch (err) {
            toast.error(parseApiError(err));
        }
        e.target.value = "";
    };

    const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) { toast.error("File must be under 10 MB"); return; }
        const formData = new FormData();
        formData.append("attachment", file);
        try {
            await uploadAttachment({ workspaceId, boardId, listId, cardId: cardData.id, file: formData }).unwrap();
            toast.success("Attachment uploaded");
        } catch (err) {
            toast.error(parseApiError(err));
        }
        e.target.value = "";
    };

    const handleDeleteAttachment = async (index: number) => {
        try {
            await deleteAttachment({ workspaceId, boardId, listId, cardId: cardData.id, index }).unwrap();
            toast.success("Attachment removed");
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handleDelete = async () => {
        try {
            await deleteCard({ workspaceId, boardId, listId, cardId: cardData.id }).unwrap();
            toast.success("Card deleted");
            setConfirmDeleteCard(false);
            onCardDeleted?.(cardData.id);
            onClose();
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handleArchive = async () => {
        try {
            await archiveCard({ workspaceId, boardId, listId, cardId: cardData.id }).unwrap();
            toast.success("Card archived");
            onCardDeleted?.(cardData.id);
            onClose();
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handleMoveList = async (targetListId: number) => {
        if (targetListId === listId) return;
        try {
            const res = await moveCard({
                workspaceId, boardId, listId, cardId: cardData.id, body: { targetListId },
            }).unwrap();
            const moved = (res as { data?: Card }).data;
            if (moved) onCardUpdate?.(moved);
            toast.success("Card moved");
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handleToggleWatch = async () => {
        try {
            const result = await toggleWatch({ workspaceId, boardId, listId, cardId: cardData.id }).unwrap() as { data?: { isWatched: boolean } };
            toast.success(result.data?.isWatched ? "Watching card" : "Stopped watching");
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handleCopyLink = async () => {
        const url = `${window.location.origin}/workspaces/${workspaceId}/boards/${boardId}?card=${cardData.id}`;
        try {
            await navigator.clipboard.writeText(url);
            toast.success("Link copied to clipboard");
        } catch {
            toast.error("Could not copy link");
        }
    };

    const handleJoin = async () => {
        if (!meId) return;
        const isAssigned = (cardData.assignees ?? []).some((a) => a.userId === meId);
        if (isAssigned) {
            toast.info("You're already on this card");
            return;
        }
        try {
            await assignUser({ workspaceId, boardId, listId, cardId: cardData.id, userId: meId }).unwrap();
            toast.success("Joined card");
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handleCopyCard = async () => {
        try {
            await createCard({
                workspaceId,
                boardId,
                listId,
                body: {
                    title: `${cardData.title} (copy)`,
                    description: cardData.description ?? undefined,
                    priority: cardData.priority,
                    labels: cardData.labels?.length ? cardData.labels : undefined,
                    tags: cardData.tags?.length ? cardData.tags : undefined,
                },
            }).unwrap();
            toast.success("Card copied to this list");
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handleEstimateBlur = () => {
        const parsed = estimateValue === "" ? null : Number(estimateValue);
        if (parsed != null && Number.isNaN(parsed)) {
            setEstimateValue(cardData.estimateHours != null ? String(cardData.estimateHours) : "");
            return;
        }
        if (parsed !== cardData.estimateHours) {
            updateField({ estimateHours: parsed });
        }
    };

    return {
        coverInputRef,
        attachmentInputRef,
        editingTitle, setEditingTitle,
        titleValue, setTitleValue,
        editingDesc, setEditingDesc,
        descValue, setDescValue,
        newChecklistItem, setNewChecklistItem,
        labelInput, setLabelInput,
        tagInput, setTagInput,
        estimateValue, setEstimateValue,
        commentInput, setCommentInput,
        editingCommentId, setEditingCommentId,
        editingCommentText, setEditingCommentText,
        hideActivityDetails, setHideActivityDetails,
        confirmDeleteCard, setConfirmDeleteCard,
        confirmDeleteCommentId, setConfirmDeleteCommentId,
        replyToComment, setReplyToComment,
        typingUsers,
        savingField,
        updating, deleting, copyingCard, postingComment, uploadingCover, uploadingAttachment, togglingWatch,
        updateField,
        handleSaveTitle,
        handleSaveDescription,
        handleToggleComplete,
        handleAddLabel,
        handleRemoveLabel,
        handleAddTag,
        handleRemoveTag,
        handleAddChecklist,
        handleToggleChecklistItem,
        handleDeleteChecklistItem,
        handleAssigneesChange,
        handlePostComment,
        handleCommentTyping,
        handleDeleteComment,
        handleSaveComment,
        handleCoverUpload,
        handleAttachmentUpload,
        handleDeleteAttachment,
        handleDelete,
        handleArchive,
        handleMoveList,
        handleToggleWatch,
        handleCopyLink,
        handleJoin,
        handleCopyCard,
        handleEstimateBlur,
    };
}

export type CardDetailActions = ReturnType<typeof useCardDetailActions>;
