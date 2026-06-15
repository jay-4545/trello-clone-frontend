"use client";
import { useState, useEffect, useRef } from "react";
import {
    X,
    AlignLeft,
    Calendar,
    CheckSquare,
    Trash2,
    Archive,
    Loader2,
    Plus,
    Check,
    MessageSquare,
    ImagePlus,
    Paperclip,
    Eye,
    EyeOff,
    ChevronDown,
    FileText,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button, Input, Textarea, Badge, ConfirmDialog } from "@/components/ui";
import Select from "@/components/ui/Select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card as UiCard, CardContent } from "@/components/ui/card";
import DatePicker from "@/components/ui/date-picker";
import CardMembersPicker from "@/components/board/CardMembersPicker";
import { parseAttachment, getAttachmentOpenUrl } from "@/lib/attachments";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    useGetCardQuery,
    useUpdateCardMutation,
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
    useGetCommentsQuery,
    useCreateCommentMutation,
    useDeleteCommentMutation,
    useUpdateCommentMutation,
} from "@/lib/api/commentApi";
import { useGetBoardMembersQuery } from "@/lib/api/boardApi";
import { useGetProfileQuery } from "@/lib/api/authApi";
import type { Card, CardPriority, CardStatus } from "@/types/card.types";
import { parseApiError } from "@/utils/errorParser";
import { cn } from "@/utils/cn";
import { getBoardTheme } from "@/lib/boardTheme";

const PRIORITIES: { value: CardPriority; label: string; color: string }[] = [
    { value: "critical", label: "Critical", color: "bg-red-100 text-red-700 border-red-300" },
    { value: "high", label: "High", color: "bg-orange-100 text-orange-700 border-orange-300" },
    { value: "medium", label: "Medium", color: "bg-blue-100 text-blue-700 border-blue-300" },
    { value: "low", label: "Low", color: "bg-slate-100 text-slate-600 border-slate-300" },
];

const STATUSES: { value: CardStatus; label: string }[] = [
    { value: "open", label: "Open" },
    { value: "in_progress", label: "In Progress" },
    { value: "in_review", label: "In Review" },
    { value: "done", label: "Done" },
];

const STATUS_OPTIONS = STATUSES.map((s) => ({ value: s.value, label: s.label }));
const PRIORITY_OPTIONS = PRIORITIES.map((p) => ({ value: p.value, label: p.label }));

const LABEL_COLORS = [
    "bg-emerald-500", "bg-blue-500", "bg-amber-500", "bg-rose-500",
    "bg-violet-500", "bg-pink-500", "bg-cyan-500", "bg-orange-500",
];

interface BoardListOption {
    id: number;
    name: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    workspaceId: number;
    boardId: number;
    boardColor: string;
    card: Card | null;
    lists?: BoardListOption[];
    readOnly?: boolean;
    onCardUpdate?: (card: Card) => void;
}

export default function CardDetailModal({ open, onClose, workspaceId, boardId, boardColor, card, lists = [], readOnly = false, onCardUpdate }: Props) {
    const theme = getBoardTheme(boardColor);
    const cardId = card?.id;
    const propListId = card?.listId;
    const skip = !open || !cardId || !propListId;

    const { data: detailData, isLoading } = useGetCardQuery(
        { workspaceId, boardId, listId: propListId!, cardId: cardId! },
        { skip }
    );
    const { data: commentsData } = useGetCommentsQuery(
        { workspaceId, boardId, cardId: cardId! },
        { skip }
    );
    const { data: membersData } = useGetBoardMembersQuery(
        { workspaceId, boardId },
        { skip: !open }
    );
    const { data: profileData } = useGetProfileQuery();

    const fetchedCard = detailData ? (detailData as { data: Card }).data : undefined;
    const cardData = fetchedCard ?? card;
    const listId = cardData?.listId ?? propListId!;
    const comments = commentsData?.data ?? [];
    const boardMembers = membersData?.data ?? [];
    const me = profileData?.data;

    const [updateCard, { isLoading: updating }] = useUpdateCardMutation();
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
    const checklistRef = useRef<HTMLDivElement>(null);
    const descRef = useRef<HTMLDivElement>(null);
    const dateRef = useRef<HTMLDivElement>(null);
    const membersRef = useRef<HTMLDivElement>(null);
    const labelsRef = useRef<HTMLDivElement>(null);

    const [editingTitle, setEditingTitle] = useState(false);
    const [titleValue, setTitleValue] = useState("");
    const [editingDesc, setEditingDesc] = useState(false);
    const [descValue, setDescValue] = useState("");
    const [newChecklistItem, setNewChecklistItem] = useState("");
    const [labelInput, setLabelInput] = useState("");
    const [commentInput, setCommentInput] = useState("");
    const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
    const [editingCommentText, setEditingCommentText] = useState("");
    const [hideActivityDetails, setHideActivityDetails] = useState(false);
    const [confirmDeleteCard, setConfirmDeleteCard] = useState(false);
    const [confirmDeleteCommentId, setConfirmDeleteCommentId] = useState<number | null>(null);

    useEffect(() => {
        if (cardData) {
            setTitleValue(cardData.title);
            setDescValue(cardData.description ?? "");
        }
    }, [cardData]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !editingTitle && !editingDesc) onClose();
        };
        if (open) document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [open, onClose, editingTitle, editingDesc]);

    if (!open) return null;

    if (!cardId || !propListId || !cardData) return null;

    const handleSaveTitle = async () => {
        const title = titleValue.trim();
        if (!title || title === cardData.title) {
            setEditingTitle(false);
            setTitleValue(cardData.title);
            return;
        }
        try {
            await updateCard({
                workspaceId, boardId, listId, cardId: cardData.id,
                body: { title },
            }).unwrap();
            setEditingTitle(false);
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handleSaveDescription = async () => {
        const description = descValue.trim();
        if (description === (cardData.description ?? "")) {
            setEditingDesc(false);
            return;
        }
        try {
            await updateCard({
                workspaceId, boardId, listId, cardId: cardData.id,
                body: { description: description || null },
            }).unwrap();
            setEditingDesc(false);
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const updateField = async (body: Record<string, unknown>) => {
        try {
            await updateCard({
                workspaceId, boardId, listId, cardId: cardData.id, body,
            }).unwrap();
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handleAddLabel = async () => {
        const t = labelInput.trim();
        if (!t) return;
        const current = cardData.labels ?? [];
        if (current.includes(t)) {
            setLabelInput("");
            return;
        }
        await updateField({ labels: [...current, t] });
        setLabelInput("");
    };

    const handleRemoveLabel = async (label: string) => {
        const current = cardData.labels ?? [];
        await updateField({ labels: current.filter((l) => l !== label) });
    };

    const handleAddChecklist = async () => {
        const text = newChecklistItem.trim();
        if (!text) return;
        try {
            await addChecklistItem({
                workspaceId, boardId, listId, cardId: cardData.id, text,
            }).unwrap();
            setNewChecklistItem("");
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handleToggleChecklistItem = async (itemId: string, completed: boolean) => {
        try {
            await updateChecklistItem({
                workspaceId, boardId, listId, cardId: cardData.id, itemId, completed,
            }).unwrap();
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handleDeleteChecklistItem = async (itemId: string) => {
        try {
            await deleteChecklistItem({
                workspaceId, boardId, listId, cardId: cardData.id, itemId,
            }).unwrap();
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
                    await assignUser({
                        workspaceId, boardId, listId, cardId: cardData.id, userId: Number(id),
                    }).unwrap();
                }
            }
            for (const id of currentIds) {
                if (!next.has(id)) {
                    await unassignUser({
                        workspaceId, boardId, listId, cardId: cardData.id, userId: Number(id),
                    }).unwrap();
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
                workspaceId, boardId, cardId: cardData.id, content,
            }).unwrap();
            setCommentInput("");
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        try {
            await deleteComment({
                workspaceId, boardId, cardId: cardData.id, commentId,
            }).unwrap();
            setConfirmDeleteCommentId(null);
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handleStartEditComment = (commentId: number, content: string) => {
        setEditingCommentId(commentId);
        setEditingCommentText(content);
    };

    const handleSaveComment = async () => {
        if (!editingCommentId) return;
        const content = editingCommentText.trim();
        if (!content) return;
        try {
            await updateComment({
                workspaceId, boardId, cardId: cardData.id,
                commentId: editingCommentId, content,
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
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image must be under 5 MB");
            return;
        }
        const formData = new FormData();
        formData.append("cover", file);
        try {
            await uploadCover({
                workspaceId, boardId, listId, cardId: cardData.id, file: formData,
            }).unwrap();
            toast.success("Cover updated");
        } catch (err) {
            toast.error(parseApiError(err));
        }
        e.target.value = "";
    };

    const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            toast.error("File must be under 10 MB");
            return;
        }
        const formData = new FormData();
        formData.append("attachment", file);
        try {
            await uploadAttachment({
                workspaceId, boardId, listId, cardId: cardData.id, file: formData,
            }).unwrap();
            toast.success("Attachment uploaded");
        } catch (err) {
            toast.error(parseApiError(err));
        }
        e.target.value = "";
    };

    const handleDeleteAttachment = async (index: number) => {
        try {
            await deleteAttachment({
                workspaceId, boardId, listId, cardId: cardData.id, index,
            }).unwrap();
            toast.success("Attachment removed");
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handleDelete = async () => {
        try {
            await deleteCard({
                workspaceId, boardId, listId, cardId: cardData.id,
            }).unwrap();
            toast.success("Card deleted");
            setConfirmDeleteCard(false);
            onClose();
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handleArchive = async () => {
        try {
            await archiveCard({
                workspaceId, boardId, listId, cardId: cardData.id,
            }).unwrap();
            toast.success("Card archived");
            onClose();
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const checklist = cardData.checklist ?? [];
    const completedCount = checklist.filter((i) => i.completed).length;
    const checklistProgress = checklist.length > 0
        ? Math.round((completedCount / checklist.length) * 100)
        : 0;

    const assigneeIds = (cardData.assignees ?? []).map((a) => String(a.userId));
    const currentListName = lists.find((l) => l.id === listId)?.name ?? "List";

    const handleMoveList = async (targetListId: number) => {
        if (targetListId === listId) return;
        try {
            const res = await moveCard({
                workspaceId,
                boardId,
                listId,
                cardId: cardData.id,
                body: { targetListId },
            }).unwrap();
            const moved = (res as { data?: Card }).data;
            if (moved) onCardUpdate?.(moved);
            toast.success("Card moved");
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
        ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
            <DialogContent
                className={cn(
                    "flex flex-col gap-0 p-0 overflow-hidden border border-slate-200 bg-white",
                    "fixed inset-0 max-h-none h-full w-full max-w-none translate-x-0 translate-y-0 rounded-none",
                    "sm:inset-auto sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%]",
                    "sm:h-auto sm:max-h-[92vh] sm:max-w-5xl sm:rounded-xl shadow-2xl",
                    "data-[state=open]:animate-in data-[state=closed]:animate-out",
                    "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
                    "data-[state=open]:duration-150 data-[state=closed]:duration-100"
                )}
                style={{ borderTopColor: theme.boardColor, borderTopWidth: "4px" }}
                onOpenAutoFocus={(e) => e.preventDefault()}
                onPointerDownOutside={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest("[role='listbox']") || target.closest("[data-radix-popper-content-wrapper]")) {
                        e.preventDefault();
                    }
                }}
            >
                {/* Cover image */}
                {cardData.coverImage ? (
                    <div className="relative group">
                        <div
                            className="h-32 sm:h-40 bg-cover bg-center rounded-t-none sm:rounded-t-2xl"
                            style={{ backgroundImage: `url(${cardData.coverImage})` }}
                        />
                        {!readOnly && (
                            <div className="absolute bottom-2 right-2 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => coverInputRef.current?.click()}
                                    className="text-xs bg-black/50 hover:bg-black/70 text-white px-2 py-1 rounded"
                                >
                                    Change
                                </button>
                                <button
                                    onClick={() => updateField({ coverImage: null })}
                                    className="text-xs bg-black/50 hover:bg-black/70 text-white px-2 py-1 rounded"
                                >
                                    Remove
                                </button>
                            </div>
                        )}
                    </div>
                ) : !readOnly ? (
                    <button
                        onClick={() => coverInputRef.current?.click()}
                        disabled={uploadingCover}
                        className="w-full h-12 sm:h-14 flex items-center justify-center gap-2 text-slate-500 hover:bg-black/5 border-b border-slate-200 text-sm cursor-pointer"
                    >
                        {uploadingCover ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                <ImagePlus className="h-4 w-4" />
                                Add cover image
                            </>
                        )}
                    </button>
                ) : null}
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

                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 z-10 flex items-center justify-center h-8 w-8 rounded-lg bg-white/90 hover:bg-white text-slate-600 shadow-sm transition-colors cursor-pointer"
                    aria-label="Close"
                >
                    <X className="h-4 w-4" />
                </button>

                {!readOnly && (
                    <button
                        onClick={() => coverInputRef.current?.click()}
                        className="absolute top-3 right-24 z-10 flex items-center justify-center h-8 w-8 rounded-lg bg-white/90 hover:bg-white text-slate-600 shadow-sm transition-colors cursor-pointer"
                        aria-label="Cover"
                        title="Cover"
                    >
                        <ImagePlus className="h-4 w-4" />
                    </button>
                )}

                {!readOnly && (
                    <button
                        onClick={async () => {
                            try {
                                const result = await toggleWatch({
                                    workspaceId,
                                    boardId,
                                    listId,
                                    cardId: cardData.id,
                                }).unwrap() as { data?: { isWatched: boolean } };
                                toast.success(result.data?.isWatched ? "Watching card" : "Stopped watching");
                            } catch (err) {
                                toast.error(parseApiError(err));
                            }
                        }}
                        disabled={togglingWatch}
                        className={cn(
                            "absolute top-3 right-14 z-10 flex items-center justify-center h-8 w-8 rounded-lg transition-colors cursor-pointer",
                            cardData.isWatched
                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                : "bg-white/90 hover:bg-white text-slate-600 shadow-sm"
                        )}
                        aria-label={cardData.isWatched ? "Unwatch card" : "Watch card"}
                        title={cardData.isWatched ? "Watching" : "Watch"}
                    >
                        {cardData.isWatched ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                )}

                {isLoading && !detailData ? (
                    <div className="flex flex-col lg:flex-row flex-1 min-h-[480px]">
                        <div className="flex-1 p-6 space-y-4">
                            <div className="h-8 w-32 bg-slate-100 rounded-lg animate-pulse" />
                            <div className="h-10 w-full bg-slate-100 rounded-lg animate-pulse" />
                            <div className="h-24 w-full bg-slate-100 rounded-lg animate-pulse" />
                            <div className="h-32 w-full bg-slate-100 rounded-lg animate-pulse" />
                        </div>
                        <div className="lg:w-[340px] border-t lg:border-t-0 lg:border-l border-slate-200 bg-slate-50 p-4">
                            <div className="h-6 w-40 bg-slate-200 rounded animate-pulse mb-4" />
                            <div className="h-20 w-full bg-slate-200 rounded-lg animate-pulse" />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
                        {/* Main column */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0">
                            {/* List selector */}
                            <div className="mb-4 pr-20">
                                {lists.length > 0 && !readOnly ? (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg px-3 py-1.5 cursor-pointer outline-none"
                                            >
                                                {currentListName}
                                                <ChevronDown className="h-3.5 w-3.5" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            align="start"
                                            className="bg-white border-slate-200 text-slate-800 min-w-[200px] z-[10050]"
                                        >
                                            {lists.map((l) => (
                                                <DropdownMenuItem
                                                    key={l.id}
                                                    onSelect={() => handleMoveList(l.id)}
                                                    className={cn(
                                                        l.id === listId && "text-blue-400"
                                                    )}
                                                >
                                                    {l.name}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                ) : (
                                    <span className="inline-flex items-center text-sm font-medium text-slate-500 bg-slate-100 rounded-lg px-3 py-1.5">
                                        {currentListName}
                                    </span>
                                )}
                            </div>

                            {/* Title */}
                            <div className="flex items-start gap-3 mb-4 pr-8">
                                <div className="mt-1 h-5 w-5 rounded-full border-2 border-[#9fadbc] shrink-0" />
                                <div className="flex-1 min-w-0">
                                    {editingTitle && !readOnly ? (
                                        <textarea
                                            autoFocus
                                            value={titleValue}
                                            onChange={(e) => setTitleValue(e.target.value)}
                                            onBlur={handleSaveTitle}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSaveTitle();
                                                }
                                                if (e.key === "Escape") {
                                                    setTitleValue(cardData.title);
                                                    setEditingTitle(false);
                                                }
                                            }}
                                            rows={2}
                                            className="w-full text-xl font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                        />
                                    ) : (
                                        <h2
                                            onClick={() => !readOnly && setEditingTitle(true)}
                                            className={cn(
                                                "text-xl font-semibold text-slate-900 leading-snug rounded px-1 -mx-1",
                                                !readOnly && "cursor-pointer hover:bg-white/5"
                                            )}
                                        >
                                            {cardData.title}
                                        </h2>
                                    )}
                                </div>
                            </div>

                            {/* Action pills */}
                            {!readOnly && (
                                <div className="flex flex-wrap gap-2 mb-5">
                                    <Button type="button" variant="outline" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => scrollTo(labelsRef)}>
                                        Labels
                                    </Button>
                                    <Button type="button" variant="outline" size="sm" leftIcon={<Calendar className="h-3.5 w-3.5" />} onClick={() => scrollTo(dateRef)}>
                                        Dates
                                    </Button>
                                    <Button type="button" variant="outline" size="sm" leftIcon={<CheckSquare className="h-3.5 w-3.5" />} onClick={() => scrollTo(checklistRef)}>
                                        Checklist
                                    </Button>
                                    <Button type="button" variant="outline" size="sm" leftIcon={<Paperclip className="h-3.5 w-3.5" />} onClick={() => attachmentInputRef.current?.click()}>
                                        Attachment
                                    </Button>
                                </div>
                            )}

                            {/* Members + Labels metadata row */}
                            <div className="space-y-4 mb-6">
                                <div ref={membersRef}>
                                    <Label className="mb-2 block">Members</Label>
                                    <CardMembersPicker
                                        members={boardMembers.map((m) => ({
                                            userId: m.userId,
                                            name: m.user.name,
                                            avatar: m.user.avatar,
                                        }))}
                                        selectedIds={assigneeIds}
                                        onChange={handleAssigneesChange}
                                        disabled={readOnly}
                                    />
                                </div>

                                <div ref={labelsRef}>
                                    <Label className="mb-2 block">Labels</Label>
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                        {(cardData.labels ?? []).map((l, idx) => (
                                            <Badge
                                                key={l}
                                                variant="default"
                                                size="sm"
                                                className={cn(
                                                    "text-white border-0 px-2.5 py-1",
                                                    LABEL_COLORS[idx % LABEL_COLORS.length]
                                                )}
                                            >
                                                {l}
                                                {!readOnly && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveLabel(l)}
                                                        className="ml-1 hover:bg-black/20 rounded cursor-pointer"
                                                        aria-label={`Remove ${l}`}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                )}
                                            </Badge>
                                        ))}
                                    </div>
                                    {!readOnly && (
                                        <div className="flex items-center gap-2 max-w-sm">
                                            <Input
                                                value={labelInput}
                                                onChange={(e) => setLabelInput(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddLabel(); } }}
                                                placeholder="Add label…"
                                                className="text-xs"
                                            />
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={handleAddLabel}
                                                disabled={!labelInput.trim()}
                                                leftIcon={<Plus className="h-3.5 w-3.5" />}
                                            >
                                                Add
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Separator className="mb-6" />

                            <div ref={dateRef} className="mb-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <Calendar className="h-4 w-4 text-slate-500" />
                                    <Label>Due date</Label>
                                </div>
                                <DatePicker
                                    value={cardData.dueDate}
                                    onChange={(dueDate) => updateField({ dueDate })}
                                    disabled={readOnly}
                                    placeholder="No due date"
                                />
                            </div>

                            <Separator className="mb-6" />

                            {/* Description */}
                            <section ref={descRef} className="mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <AlignLeft className="h-4 w-4 text-slate-500" />
                                        <Label className="text-sm font-semibold text-slate-800">Description</Label>
                                    </div>
                                    {!readOnly && !editingDesc && cardData.description && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setEditingDesc(true)}
                                        >
                                            Edit
                                        </Button>
                                    )}
                                </div>
                                {editingDesc ? (
                                    <UiCard className="border-blue-200 shadow-none ring-2 ring-blue-100">
                                        <CardContent className="pt-4 pb-4 space-y-3">
                                            <Textarea
                                                autoFocus
                                                value={descValue}
                                                onChange={(e) => setDescValue(e.target.value)}
                                                rows={6}
                                                placeholder="Add a more detailed description…"
                                            />
                                            <div className="flex items-center gap-2">
                                                <Button type="button" size="sm" onClick={handleSaveDescription} loading={updating}>
                                                    Save
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setDescValue(cardData.description ?? "");
                                                        setEditingDesc(false);
                                                    }}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </UiCard>
                                ) : (
                                    <div
                                        onClick={() => !readOnly && setEditingDesc(true)}
                                        className={cn(
                                            "rounded-lg border px-4 py-3 min-h-[88px] transition-colors",
                                            cardData.description
                                                ? "border-slate-200 bg-white"
                                                : "border-dashed border-slate-300 bg-slate-50/80",
                                            !readOnly && "cursor-pointer hover:border-slate-400 hover:bg-slate-50"
                                        )}
                                    >
                                        {cardData.description ? (
                                            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                                {cardData.description}
                                            </p>
                                        ) : (
                                            <p className="text-sm text-slate-400">
                                                Add a more detailed description…
                                            </p>
                                        )}
                                    </div>
                                )}
                            </section>

                            {/* Attachments */}
                            <section className="mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Paperclip className="h-4 w-4 text-slate-500" />
                                        <h3 className="text-sm font-semibold text-slate-800">Attachments</h3>
                                    </div>
                                    {!readOnly && (
                                        <button
                                            onClick={() => attachmentInputRef.current?.click()}
                                            disabled={uploadingAttachment}
                                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                                        >
                                            {uploadingAttachment ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                                <Plus className="h-3 w-3" />
                                            )}
                                            Add
                                        </button>
                                    )}
                                </div>
                                {(cardData.attachments ?? []).length === 0 ? (
                                    <p className="text-xs text-slate-500">No attachments</p>
                                ) : (
                                    <div className="space-y-2">
                                        {(cardData.attachments ?? []).map((raw, idx) => {
                                            const parsed = parseAttachment(raw);
                                            const href = getAttachmentOpenUrl(parsed);
                                            return (
                                                <div
                                                    key={`${parsed.url}-${idx}`}
                                                    className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 hover:bg-slate-100 transition-colors"
                                                >
                                                    <div className="flex items-center justify-center h-9 w-9 rounded-md bg-white border border-slate-200 shrink-0">
                                                        {parsed.isPdf ? (
                                                            <FileText className="h-4 w-4 text-red-500" />
                                                        ) : (
                                                            <Paperclip className="h-4 w-4 text-slate-500" />
                                                        )}
                                                    </div>
                                                    <a
                                                        href={href}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm font-medium text-blue-600 hover:underline truncate flex-1 cursor-pointer"
                                                    >
                                                        {parsed.name}
                                                    </a>
                                                    {!readOnly && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteAttachment(idx)}
                                                            className="text-slate-400 hover:text-red-500 cursor-pointer p-1"
                                                            aria-label="Remove attachment"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </section>

                            {/* Checklist */}
                            <section ref={checklistRef} className="mb-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckSquare className="h-4 w-4 text-slate-500" />
                                    <h3 className="text-sm font-semibold text-slate-800">Checklist</h3>
                                    {checklist.length > 0 && (
                                        <span className="text-xs text-slate-500">
                                            {completedCount}/{checklist.length}
                                        </span>
                                    )}
                                </div>

                                {checklist.length > 0 && (
                                    <div className="mb-3">
                                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-green-500 transition-all duration-300"
                                                style={{ width: `${checklistProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-1">
                                    {checklist.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 group"
                                        >
                                            <button
                                                onClick={() => !readOnly && handleToggleChecklistItem(item.id, !item.completed)}
                                                disabled={readOnly}
                                                className={cn(
                                                    "h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer",
                                                    item.completed
                                                        ? "bg-green-500 border-green-500"
                                                        : "border-[#9fadbc] hover:border-white"
                                                )}
                                            >
                                                {item.completed && <Check className="h-3 w-3 text-white" />}
                                            </button>
                                            <span className={cn(
                                                "text-sm flex-1",
                                                item.completed ? "text-slate-500 line-through" : "text-slate-800"
                                            )}>
                                                {item.text}
                                            </span>
                                            {!readOnly && (
                                                <button
                                                    onClick={() => handleDeleteChecklistItem(item.id)}
                                                    className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all cursor-pointer"
                                                    aria-label="Delete item"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {!readOnly && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <Input
                                            value={newChecklistItem}
                                            onChange={(e) => setNewChecklistItem(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === "Enter") handleAddChecklist(); }}
                                            placeholder="Add an item…"
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={handleAddChecklist}
                                            disabled={!newChecklistItem.trim()}
                                        >
                                            Add
                                        </Button>
                                    </div>
                                )}
                            </section>

                            {/* Status + priority */}
                            <UiCard className="mb-4 border-slate-200 shadow-none">
                                <CardContent className="pt-4 pb-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <Label className="mb-1.5 block">Status</Label>
                                            <Select
                                                options={STATUS_OPTIONS}
                                                value={cardData.status}
                                                onChange={(status) => updateField({ status })}
                                                disabled={readOnly}
                                                size="sm"
                                                inModal
                                            />
                                        </div>
                                        <div>
                                            <Label className="mb-1.5 block">Priority</Label>
                                            <Select
                                                options={PRIORITY_OPTIONS}
                                                value={cardData.priority}
                                                onChange={(priority) => updateField({ priority })}
                                                disabled={readOnly}
                                                size="sm"
                                                inModal
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </UiCard>

                            {!readOnly && (
                                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                                    <Button type="button" variant="outline" size="sm" onClick={handleArchive} leftIcon={<Archive className="h-4 w-4" />}>
                                        Archive
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setConfirmDeleteCard(true)}
                                        loading={deleting}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                        leftIcon={<Trash2 className="h-4 w-4" />}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Activity sidebar — Trello-style */}
                        <div className="lg:w-[340px] shrink-0 border-t lg:border-t-0 lg:border-l border-slate-200 bg-slate-50 flex flex-col min-h-[280px] lg:min-h-0 max-h-[50vh] lg:max-h-none">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 shrink-0">
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4 text-slate-500" />
                                    <h3 className="text-sm font-semibold text-slate-800">Comments and activity</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setHideActivityDetails((v) => !v)}
                                    className="text-xs text-slate-500 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100 cursor-pointer"
                                >
                                    {hideActivityDetails ? "Show details" : "Hide details"}
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                                {!readOnly && (
                                    <Textarea
                                        value={commentInput}
                                        onChange={(e) => setCommentInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                                                e.preventDefault();
                                                handlePostComment();
                                            }
                                        }}
                                        placeholder="Write a comment…"
                                        rows={3}
                                    />
                                )}
                                {commentInput.trim() && !readOnly && (
                                    <Button type="button" size="sm" onClick={handlePostComment} loading={postingComment}>
                                        Save
                                    </Button>
                                )}

                                {!hideActivityDetails && (
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-2 text-sm">
                                            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                {(cardData.creator?.name ?? "?")[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-slate-800">
                                                    <span className="font-medium">{cardData.creator?.name ?? "Someone"}</span>
                                                    {" "}added this card
                                                </p>
                                                <p className="text-xs text-blue-400 mt-0.5">
                                                    {format(new Date(cardData.createdAt), "MMM d, yyyy, h:mm a")}
                                                </p>
                                            </div>
                                        </div>

                                        {comments.map((c) => {
                                            const isMine = me?.id === c.userId;
                                            return (
                                                <div key={c.id} className="flex items-start gap-2 group">
                                                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                        {c.author.name[0].toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-slate-800">
                                                            <span className="font-medium">{c.author.name}</span>
                                                            {c.isDeleted ? " deleted a comment" : ""}
                                                        </p>
                                                        {!c.isDeleted && (
                                                            <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap break-words">
                                                                {editingCommentId === c.id ? (
                                                                    <textarea
                                                                        autoFocus
                                                                        value={editingCommentText}
                                                                        onChange={(e) => setEditingCommentText(e.target.value)}
                                                                        rows={3}
                                                                        className="w-full text-sm text-slate-800 bg-white border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                                                    />
                                                                ) : c.content}
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-blue-400 mt-1">
                                                            {format(new Date(c.createdAt), "MMM d, yyyy, h:mm a")}
                                                            {c.isEdited && " (edited)"}
                                                        </p>
                                                        {isMine && !c.isDeleted && editingCommentId !== c.id && (
                                                            <div className="flex items-center gap-2 mt-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                                                                <button
                                                                    onClick={() => handleStartEditComment(c.id, c.content)}
                                                                    className="text-[10px] text-slate-500 hover:underline cursor-pointer"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setConfirmDeleteCommentId(c.id)}
                                                                    className="text-[10px] text-red-400 hover:underline cursor-pointer"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        )}
                                                        {editingCommentId === c.id && (
                                                            <div className="flex gap-2 mt-2">
                                                                <button onClick={handleSaveComment} className="text-xs text-blue-400 hover:underline cursor-pointer">Save</button>
                                                                <button
                                                                    onClick={() => { setEditingCommentId(null); setEditingCommentText(""); }}
                                                                    className="text-xs text-slate-500 hover:underline cursor-pointer"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>

            <ConfirmDialog
                open={confirmDeleteCard}
                onClose={() => setConfirmDeleteCard(false)}
                onConfirm={handleDelete}
                loading={deleting}
                title="Delete this card?"
                description="This action cannot be undone."
                confirmLabel="Delete card"
                variant="danger"
            />
            <ConfirmDialog
                open={confirmDeleteCommentId !== null}
                onClose={() => setConfirmDeleteCommentId(null)}
                onConfirm={() => confirmDeleteCommentId && handleDeleteComment(confirmDeleteCommentId)}
                title="Delete comment?"
                description="This comment will be permanently removed."
                confirmLabel="Delete"
                variant="danger"
            />
        </Dialog>
    );
}
