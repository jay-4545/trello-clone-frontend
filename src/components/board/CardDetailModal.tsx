"use client";
import { useState, useEffect, useRef } from "react";
import {
    X,
    AlignLeft,
    Calendar,
    CheckSquare,
    Tag,
    Trash2,
    Archive,
    Loader2,
    Plus,
    Check,
    AlertTriangle,
    Flag,
    User as UserIcon,
    MessageSquare,
    Send,
    Edit2,
    ImagePlus,
    Paperclip,
    ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { createPortal } from "react-dom";
import { format, formatDistanceToNow } from "date-fns";

import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
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

function parseAttachment(urlWithName: string) {
    const hashIdx = urlWithName.indexOf("#");
    if (hashIdx === -1) return { url: urlWithName, name: "Attachment" };
    return {
        url: urlWithName.slice(0, hashIdx),
        name: decodeURIComponent(urlWithName.slice(hashIdx + 1)),
    };
}

interface Props {
    open: boolean;
    onClose: () => void;
    workspaceId: number;
    boardId: number;
    card: Card | null;
    readOnly?: boolean;
}

export default function CardDetailModal({ open, onClose, workspaceId, boardId, card, readOnly = false }: Props) {
    const cardId = card?.id;
    const listId = card?.listId;

    const skip = !open || !cardId || !listId;

    const { data: detailData, isLoading } = useGetCardQuery(
        { workspaceId, boardId, listId: listId!, cardId: cardId! },
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

    const fullCard = detailData?.data ?? card;
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

    const coverInputRef = useRef<HTMLInputElement>(null);
    const attachmentInputRef = useRef<HTMLInputElement>(null);

    const [editingTitle, setEditingTitle] = useState(false);
    const [titleValue, setTitleValue] = useState("");
    const [editingDesc, setEditingDesc] = useState(false);
    const [descValue, setDescValue] = useState("");
    const [newChecklistItem, setNewChecklistItem] = useState("");
    const [labelInput, setLabelInput] = useState("");
    const [tagInput, setTagInput] = useState("");
    const [commentInput, setCommentInput] = useState("");
    const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
    const [editingCommentText, setEditingCommentText] = useState("");

    useEffect(() => {
        if (fullCard) {
            setTitleValue(fullCard.title);
            setDescValue(fullCard.description ?? "");
        }
    }, [fullCard]);

    useEffect(() => {
        if (open) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !editingTitle && !editingDesc) onClose();
        };
        if (open) document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [open, onClose, editingTitle, editingDesc]);

    if (!open || !fullCard || !listId) return null;

    const handleSaveTitle = async () => {
        const title = titleValue.trim();
        if (!title || title === fullCard.title) {
            setEditingTitle(false);
            setTitleValue(fullCard.title);
            return;
        }
        try {
            await updateCard({
                workspaceId, boardId, listId, cardId: fullCard.id,
                body: { title },
            }).unwrap();
            setEditingTitle(false);
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handleSaveDescription = async () => {
        const description = descValue.trim();
        if (description === (fullCard.description ?? "")) {
            setEditingDesc(false);
            return;
        }
        try {
            await updateCard({
                workspaceId, boardId, listId, cardId: fullCard.id,
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
                workspaceId, boardId, listId, cardId: fullCard.id, body,
            }).unwrap();
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handleAddLabel = async () => {
        const t = labelInput.trim();
        if (!t) return;
        const current = fullCard.labels ?? [];
        if (current.includes(t)) {
            setLabelInput("");
            return;
        }
        await updateField({ labels: [...current, t] });
        setLabelInput("");
    };

    const handleRemoveLabel = async (label: string) => {
        const current = fullCard.labels ?? [];
        await updateField({ labels: current.filter((l) => l !== label) });
    };

    const handleAddTag = async () => {
        const t = tagInput.trim();
        if (!t) return;
        const current = fullCard.tags ?? [];
        if (current.includes(t)) {
            setTagInput("");
            return;
        }
        await updateField({ tags: [...current, t] });
        setTagInput("");
    };

    const handleRemoveTag = async (tag: string) => {
        const current = fullCard.tags ?? [];
        await updateField({ tags: current.filter((t) => t !== tag) });
    };

    const handleAddChecklist = async () => {
        const text = newChecklistItem.trim();
        if (!text) return;
        try {
            await addChecklistItem({
                workspaceId, boardId, listId, cardId: fullCard.id, text,
            }).unwrap();
            setNewChecklistItem("");
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handleToggleChecklistItem = async (itemId: string, completed: boolean) => {
        try {
            await updateChecklistItem({
                workspaceId, boardId, listId, cardId: fullCard.id, itemId, completed,
            }).unwrap();
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handleDeleteChecklistItem = async (itemId: string) => {
        try {
            await deleteChecklistItem({
                workspaceId, boardId, listId, cardId: fullCard.id, itemId,
            }).unwrap();
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handleAssigneesChange = async (ids: string[]) => {
        const currentIds = (fullCard.assignees ?? []).map((a) => String(a.userId));
        const prev = new Set(currentIds);
        const next = new Set(ids);
        try {
            for (const id of ids) {
                if (!prev.has(id)) {
                    await assignUser({
                        workspaceId, boardId, listId, cardId: fullCard.id, userId: Number(id),
                    }).unwrap();
                }
            }
            for (const id of currentIds) {
                if (!next.has(id)) {
                    await unassignUser({
                        workspaceId, boardId, listId, cardId: fullCard.id, userId: Number(id),
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
                workspaceId, boardId, cardId: fullCard.id, content,
            }).unwrap();
            setCommentInput("");
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        if (!confirm("Delete this comment?")) return;
        try {
            await deleteComment({
                workspaceId, boardId, cardId: fullCard.id, commentId,
            }).unwrap();
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
                workspaceId, boardId, cardId: fullCard.id,
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
                workspaceId, boardId, listId, cardId: fullCard.id, file: formData,
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
                workspaceId, boardId, listId, cardId: fullCard.id, file: formData,
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
                workspaceId, boardId, listId, cardId: fullCard.id, index,
            }).unwrap();
            toast.success("Attachment removed");
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handleDelete = async () => {
        if (!confirm("Delete this card? This cannot be undone.")) return;
        try {
            await deleteCard({
                workspaceId, boardId, listId, cardId: fullCard.id,
            }).unwrap();
            toast.success("Card deleted");
            onClose();
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handleArchive = async () => {
        try {
            await archiveCard({
                workspaceId, boardId, listId, cardId: fullCard.id,
            }).unwrap();
            toast.success("Card archived");
            onClose();
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const checklist = fullCard.checklist ?? [];
    const completedCount = checklist.filter((i) => i.completed).length;
    const checklistProgress = checklist.length > 0
        ? Math.round((completedCount / checklist.length) * 100)
        : 0;

    const memberOptions = boardMembers.map((m) => ({
        value: String(m.userId),
        label: m.user.name,
    }));
    const assigneeIds = (fullCard.assignees ?? []).map((a) => String(a.userId));

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
            role="dialog"
            aria-modal="true"
        >
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative w-full sm:max-w-3xl bg-slate-50 rounded-none sm:rounded-2xl shadow-2xl my-0 sm:my-8 min-h-screen sm:min-h-0 sm:max-h-[90vh] overflow-y-auto">
                {/* Cover image */}
                {fullCard.coverImage ? (
                    <div className="relative group">
                        <div
                            className="h-32 sm:h-40 bg-cover bg-center rounded-t-none sm:rounded-t-2xl"
                            style={{ backgroundImage: `url(${fullCard.coverImage})` }}
                        />
                        {!readOnly && (
                            <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                        className="w-full h-16 sm:h-20 flex items-center justify-center gap-2 text-slate-500 hover:bg-slate-100 border-b border-slate-200 text-sm"
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
                    className="absolute top-3 right-3 z-10 flex items-center justify-center h-9 w-9 rounded-lg bg-white/90 hover:bg-white shadow-sm text-slate-600 transition-colors"
                    aria-label="Close"
                >
                    <X className="h-4 w-4" />
                </button>

                {isLoading && !fullCard ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
                    </div>
                ) : (
                    <div className="p-4 sm:p-6">
                        {/* Title */}
                        <div className="mb-1 pr-12">
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
                                            setTitleValue(fullCard.title);
                                            setEditingTitle(false);
                                        }
                                    }}
                                    rows={2}
                                    className="w-full text-xl font-bold text-slate-900 bg-white border border-blue-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                            ) : (
                                <h2
                                    onClick={() => !readOnly && setEditingTitle(true)}
                                    className={cn(
                                        "text-xl font-bold text-slate-900 rounded px-2 py-1 -mx-2",
                                        !readOnly && "cursor-pointer hover:bg-slate-100"
                                    )}
                                >
                                    {fullCard.title}
                                </h2>
                            )}
                        </div>

                        {/* Status row */}
                        <div className="flex items-center gap-2 mb-6 flex-wrap text-xs">
                            <Select
                                options={STATUS_OPTIONS}
                                value={fullCard.status}
                                onChange={(status) => updateField({ status })}
                                disabled={readOnly}
                                size="sm"
                                className="w-36"
                            />
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-500">
                                Created {format(new Date(fullCard.createdAt), "MMM d, yyyy")}
                            </span>
                            {fullCard.creator && (
                                <>
                                    <span className="text-slate-400">·</span>
                                    <span className="text-slate-500">by {fullCard.creator.name}</span>
                                </>
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Main content */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Description */}
                                <section>
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlignLeft className="h-4 w-4 text-slate-500" />
                                        <h3 className="text-sm font-semibold text-slate-700">Description</h3>
                                    </div>
                                    {editingDesc ? (
                                        <div className="space-y-2">
                                            <textarea
                                                autoFocus
                                                value={descValue}
                                                onChange={(e) => setDescValue(e.target.value)}
                                                rows={5}
                                                placeholder="Add a more detailed description…"
                                                className="w-full text-sm text-slate-800 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                            />
                                            <div className="flex items-center gap-2">
                                                <Button size="sm" onClick={handleSaveDescription} loading={updating}>
                                                    Save
                                                </Button>
                                                <button
                                                    onClick={() => {
                                                        setDescValue(fullCard.description ?? "");
                                                        setEditingDesc(false);
                                                    }}
                                                    className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => !readOnly && setEditingDesc(true)}
                                            className={cn(
                                                "rounded-lg px-3 py-3 transition-colors",
                                                !readOnly && "cursor-pointer",
                                                fullCard.description
                                                    ? "bg-white border border-slate-200 hover:border-slate-300"
                                                    : "bg-slate-100",
                                                !readOnly && !fullCard.description && "hover:bg-slate-200/70"
                                            )}
                                        >
                                            {fullCard.description ? (
                                                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                                    {fullCard.description}
                                                </p>
                                            ) : (
                                                <p className="text-sm text-slate-400">Add a more detailed description…</p>
                                            )}
                                        </div>
                                    )}
                                </section>

                                {/* Labels & Tags */}
                                <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Tag className="h-4 w-4 text-slate-500" />
                                            <h3 className="text-sm font-semibold text-slate-700">Labels</h3>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 mb-2">
                                            {(fullCard.labels ?? []).map((l, idx) => (
                                                <span
                                                    key={l}
                                                    className={cn(
                                                        "inline-flex items-center gap-1 text-xs font-medium text-white px-2 py-1 rounded",
                                                        LABEL_COLORS[idx % LABEL_COLORS.length]
                                                    )}
                                                >
                                                    {l}
                                                    {!readOnly && (
                                                        <button
                                                            onClick={() => handleRemoveLabel(l)}
                                                            className="hover:bg-black/20 rounded"
                                                            aria-label={`Remove ${l}`}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    )}
                                                </span>
                                            ))}
                                        </div>
                                        {!readOnly && (
                                        <div className="flex items-center gap-1">
                                            <input
                                                value={labelInput}
                                                onChange={(e) => setLabelInput(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddLabel(); } }}
                                                placeholder="Add label..."
                                                className="flex-1 text-xs bg-white border border-slate-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                onClick={handleAddLabel}
                                                disabled={!labelInput.trim()}
                                                className="flex items-center justify-center h-7 w-7 rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-40 text-slate-700"
                                            >
                                                <Plus className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                        )}
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Tag className="h-4 w-4 text-slate-500" />
                                            <h3 className="text-sm font-semibold text-slate-700">Tags</h3>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 mb-2">
                                            {(fullCard.tags ?? []).map((t) => (
                                                <span
                                                    key={t}
                                                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 px-2 py-1 rounded"
                                                >
                                                    #{t}
                                                    {!readOnly && (
                                                        <button
                                                            onClick={() => handleRemoveTag(t)}
                                                            className="hover:bg-slate-200 rounded"
                                                            aria-label={`Remove ${t}`}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    )}
                                                </span>
                                            ))}
                                        </div>
                                        {!readOnly && (
                                        <div className="flex items-center gap-1">
                                            <input
                                                value={tagInput}
                                                onChange={(e) => setTagInput(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(); } }}
                                                placeholder="Add tag..."
                                                className="flex-1 text-xs bg-white border border-slate-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                onClick={handleAddTag}
                                                disabled={!tagInput.trim()}
                                                className="flex items-center justify-center h-7 w-7 rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-40 text-slate-700"
                                            >
                                                <Plus className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                        )}
                                    </div>
                                </section>

                                {/* Attachments */}
                                <section>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Paperclip className="h-4 w-4 text-slate-500" />
                                            <h3 className="text-sm font-semibold text-slate-700">Attachments</h3>
                                        </div>
                                        {!readOnly && (
                                            <button
                                                onClick={() => attachmentInputRef.current?.click()}
                                                disabled={uploadingAttachment}
                                                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
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
                                    {(fullCard.attachments ?? []).length === 0 ? (
                                        <p className="text-xs text-slate-400">No attachments</p>
                                    ) : (
                                        <div className="space-y-1.5">
                                            {(fullCard.attachments ?? []).map((raw, idx) => {
                                                const { url, name } = parseAttachment(raw);
                                                return (
                                                    <div
                                                        key={`${url}-${idx}`}
                                                        className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2"
                                                    >
                                                        <Paperclip className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                        <a
                                                            href={url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm text-blue-600 hover:underline truncate flex-1"
                                                        >
                                                            {name}
                                                        </a>
                                                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-600">
                                                            <ExternalLink className="h-3.5 w-3.5" />
                                                        </a>
                                                        {!readOnly && (
                                                            <button
                                                                onClick={() => handleDeleteAttachment(idx)}
                                                                className="text-slate-400 hover:text-red-500"
                                                                aria-label="Remove attachment"
                                                            >
                                                                <X className="h-3.5 w-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </section>

                                {/* Checklist */}
                                <section>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <CheckSquare className="h-4 w-4 text-slate-500" />
                                            <h3 className="text-sm font-semibold text-slate-700">Checklist</h3>
                                            {checklist.length > 0 && (
                                                <span className="text-xs text-slate-500">
                                                    {completedCount}/{checklist.length}
                                                </span>
                                            )}
                                        </div>
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
                                                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-100 group"
                                            >
                                                <button
                                                    onClick={() => !readOnly && handleToggleChecklistItem(item.id, !item.completed)}
                                                    disabled={readOnly}
                                                    className={cn(
                                                        "h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                                                        item.completed
                                                            ? "bg-green-500 border-green-500"
                                                            : "border-slate-300 hover:border-slate-500"
                                                    )}
                                                >
                                                    {item.completed && <Check className="h-3 w-3 text-white" />}
                                                </button>
                                                <span className={cn(
                                                    "text-sm flex-1",
                                                    item.completed ? "text-slate-400 line-through" : "text-slate-700"
                                                )}>
                                                    {item.text}
                                                </span>
                                                {!readOnly && (
                                                    <button
                                                        onClick={() => handleDeleteChecklistItem(item.id)}
                                                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all"
                                                        aria-label="Delete item"
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {!readOnly && <div className="flex items-center gap-2 mt-2">
                                        <input
                                            value={newChecklistItem}
                                            onChange={(e) => setNewChecklistItem(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === "Enter") handleAddChecklist(); }}
                                            placeholder="Add an item…"
                                            className="flex-1 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <Button size="sm" onClick={handleAddChecklist} disabled={!newChecklistItem.trim()}>
                                            Add
                                        </Button>
                                    </div>}
                                </section>

                                {/* Comments */}
                                <section>
                                    <div className="flex items-center gap-2 mb-3">
                                        <MessageSquare className="h-4 w-4 text-slate-500" />
                                        <h3 className="text-sm font-semibold text-slate-700">
                                            Comments {comments.length > 0 && `(${comments.length})`}
                                        </h3>
                                    </div>

                                    {/* Add comment */}
                                    {!readOnly && <div className="flex items-start gap-2 mb-4">
                                        {me && (
                                            <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                                                {me.name[0].toUpperCase()}
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <textarea
                                                value={commentInput}
                                                onChange={(e) => setCommentInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                                                        e.preventDefault();
                                                        handlePostComment();
                                                    }
                                                }}
                                                placeholder="Write a comment…"
                                                rows={2}
                                                className="w-full text-sm text-slate-800 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                            />
                                            {commentInput.trim() && (
                                                <div className="flex items-center justify-between mt-1.5">
                                                    <span className="text-[10px] text-slate-400">
                                                        Press Ctrl+Enter to post
                                                    </span>
                                                    <Button
                                                        size="sm"
                                                        onClick={handlePostComment}
                                                        loading={postingComment}
                                                        leftIcon={<Send className="h-3 w-3" />}
                                                    >
                                                        Post
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>}

                                    {/* Comments list */}
                                    <div className="space-y-3">
                                        {comments.length === 0 && (
                                            <p className="text-xs text-slate-400 italic px-2">No comments yet.</p>
                                        )}
                                        {comments.map((c) => {
                                            const isMine = me?.id === c.userId;
                                            return (
                                                <div key={c.id} className="flex items-start gap-2 group">
                                                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                        {c.author.name[0].toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="bg-white border border-slate-200 rounded-lg px-3 py-2">
                                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                                <span className="text-xs font-semibold text-slate-800">
                                                                    {c.author.name}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400">
                                                                    {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                                                                </span>
                                                                {c.isEdited && (
                                                                    <span className="text-[10px] text-slate-400">(edited)</span>
                                                                )}
                                                            </div>
                                                            {editingCommentId === c.id ? (
                                                                <div className="space-y-2">
                                                                    <textarea
                                                                        autoFocus
                                                                        value={editingCommentText}
                                                                        onChange={(e) => setEditingCommentText(e.target.value)}
                                                                        rows={3}
                                                                        className="w-full text-sm text-slate-800 bg-white border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                                                    />
                                                                    <div className="flex items-center gap-2">
                                                                        <Button size="sm" onClick={handleSaveComment}>Save</Button>
                                                                        <button
                                                                            onClick={() => { setEditingCommentId(null); setEditingCommentText(""); }}
                                                                            className="text-xs text-slate-500 hover:text-slate-700"
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <p className={cn(
                                                                    "text-sm whitespace-pre-wrap break-words",
                                                                    c.isDeleted ? "text-slate-400 italic" : "text-slate-700"
                                                                )}>
                                                                    {c.content}
                                                                </p>
                                                            )}
                                                        </div>
                                                        {isMine && !c.isDeleted && editingCommentId !== c.id && (
                                                            <div className="flex items-center gap-2 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => handleStartEditComment(c.id, c.content)}
                                                                    className="text-[10px] text-slate-500 hover:underline flex items-center gap-0.5"
                                                                >
                                                                    <Edit2 className="h-3 w-3" />
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteComment(c.id)}
                                                                    className="text-[10px] text-red-500 hover:underline"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            </div>

                            {/* Sidebar */}
                            <div className="space-y-4">
                                {/* Priority */}
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Flag className="h-3 w-3" />
                                        Priority
                                    </p>
                                    <Select
                                        options={PRIORITY_OPTIONS}
                                        value={fullCard.priority}
                                        onChange={(priority) => updateField({ priority })}
                                        disabled={readOnly}
                                        size="sm"
                                    />
                                </div>

                                {/* Due date */}
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Calendar className="h-3 w-3" />
                                        Due date
                                    </p>
                                    <input
                                        type="date"
                                        value={fullCard.dueDate ? fullCard.dueDate.split("T")[0] : ""}
                                        onChange={(e) => updateField({ dueDate: e.target.value || null })}
                                        disabled={readOnly}
                                        className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
                                    />
                                    {fullCard.dueDate && !readOnly && (
                                        <button
                                            onClick={() => updateField({ dueDate: null })}
                                            className="text-xs text-slate-400 hover:text-red-500 mt-1"
                                        >
                                            Clear date
                                        </button>
                                    )}
                                </div>

                                {/* Assignees */}
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <UserIcon className="h-3 w-3" />
                                        Members
                                    </p>
                                    <Select
                                        mode="multiple"
                                        options={memberOptions}
                                        value={assigneeIds}
                                        onChange={handleAssigneesChange}
                                        disabled={readOnly}
                                        placeholder="Assign members…"
                                        searchable
                                        size="sm"
                                        emptyMessage="No board members"
                                        maxTags={3}
                                    />
                                </div>

                                {/* Actions */}
                                {!readOnly && <div className="pt-4 border-t border-slate-200 space-y-1.5">
                                    <button
                                        onClick={handleArchive}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 bg-white border border-slate-200 hover:bg-slate-50"
                                    >
                                        <Archive className="h-4 w-4" />
                                        Archive
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={deleting}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 bg-white border border-red-200 hover:bg-red-50 disabled:opacity-50"
                                    >
                                        {deleting ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-4 w-4" />
                                        )}
                                        Delete
                                    </button>
                                </div>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
