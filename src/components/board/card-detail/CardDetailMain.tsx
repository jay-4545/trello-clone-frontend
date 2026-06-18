"use client";
import { format } from "date-fns";
import { AlignLeft, Check, CheckSquare, ExternalLink, FileText, Loader2, Paperclip, Plus, X } from "lucide-react";
import { Button, Textarea } from "@/components/ui";
import { parseAttachment, getAttachmentOpenUrl } from "@/lib/attachments";
import type { Card } from "@/types/card.types";
import type { CardDetailActions } from "./useCardDetailActions";
import CardDetailSection from "./CardDetailSection";
import CardDetailEmpty from "./CardDetailEmpty";
import { cn } from "@/utils/cn";

interface Props {
    card: Card;
    readOnly: boolean;
    accentColor?: string;
    actions: CardDetailActions;
}

export default function CardDetailMain({ card, readOnly, accentColor, actions }: Props) {
    const {
        editingDesc,
        setEditingDesc,
        descValue,
        setDescValue,
        handleSaveDescription,
        savingField,
        handleToggleChecklistItem,
        handleDeleteChecklistItem,
        handleDeleteAttachment,
        uploadingAttachment,
        attachmentInputRef,
    } = actions;

    const checklist = card.checklist ?? [];
    const completedCount = checklist.filter((i) => i.completed).length;
    const checklistProgress = checklist.length > 0
        ? Math.round((completedCount / checklist.length) * 100)
        : 0;
    const isSavingDesc = savingField === "description";

    return (
        <div className="space-y-8">
            <CardDetailSection
                icon={AlignLeft}
                title="Description"
                accentColor={accentColor}
                saving={isSavingDesc}
                action={
                    !readOnly && !editingDesc && card.description ? (
                        <Button type="button" variant="ghost" size="sm" onClick={() => setEditingDesc(true)}>
                            Edit
                        </Button>
                    ) : undefined
                }
            >
                {editingDesc ? (
                    <div className="space-y-3 animate-in fade-in-0 duration-150">
                        <Textarea
                            autoFocus
                            value={descValue}
                            onChange={(e) => setDescValue(e.target.value)}
                            rows={6}
                            placeholder="Add a more detailed description…"
                            disabled={isSavingDesc}
                            className="border-slate-300 focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleSaveDescription}
                                loading={isSavingDesc}
                            >
                                Save
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                    setDescValue(card.description ?? "");
                                    setEditingDesc(false);
                                }}
                                disabled={isSavingDesc}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div
                        onClick={() => !readOnly && setEditingDesc(true)}
                        className={cn(
                            "rounded-lg border px-4 py-3 min-h-[72px] transition-colors duration-150 animate-in fade-in-0",
                            card.description ? "border-slate-200 bg-white" : "border-dashed border-slate-300 bg-slate-50/80",
                            !readOnly && "cursor-pointer hover:border-slate-400 hover:bg-slate-50"
                        )}
                    >
                        {card.description ? (
                            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{card.description}</p>
                        ) : (
                            <p className="text-sm text-slate-400">Add a more detailed description…</p>
                        )}
                    </div>
                )}
            </CardDetailSection>

            <CardDetailSection
                icon={Paperclip}
                title="Attachments"
                accentColor={accentColor}
                action={
                    !readOnly ? (
                        <button
                            type="button"
                            onClick={() => attachmentInputRef.current?.click()}
                            disabled={uploadingAttachment}
                            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer transition-colors duration-150"
                        >
                            {uploadingAttachment ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                            Add
                        </button>
                    ) : undefined
                }
            >
                {(card.attachments ?? []).length === 0 ? (
                    <CardDetailEmpty icon={Paperclip} message="No attachments yet" />
                ) : (
                    <div className="space-y-2">
                        {(card.attachments ?? []).map((raw, idx) => {
                            const parsed = parseAttachment(raw);
                            const href = getAttachmentOpenUrl(parsed);
                            return (
                                <div
                                    key={`${parsed.url}-${idx}`}
                                    className="flex items-center gap-3 rounded-lg hover:bg-slate-50 px-2 py-2 transition-colors duration-150 group"
                                >
                                    <div className="h-14 w-20 rounded-md bg-slate-100 border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center">
                                        {parsed.isImage ? (
                                            <img src={href} alt="" className="h-full w-full object-cover" />
                                        ) : parsed.isPdf ? (
                                            <FileText className="h-6 w-6 text-red-500" />
                                        ) : (
                                            <Paperclip className="h-5 w-5 text-slate-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <a
                                            href={href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm font-semibold text-[#172b4d] hover:underline truncate block"
                                        >
                                            {parsed.name}
                                        </a>
                                        <p className="text-xs text-[#5e6c84] mt-0.5">
                                            Added {format(new Date(card.updatedAt), "MMM d, yyyy, h:mm a")}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <a
                                            href={href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1.5 rounded hover:bg-slate-200 text-slate-500"
                                            aria-label="Open attachment"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                        {!readOnly && (
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteAttachment(idx)}
                                                className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 cursor-pointer"
                                                aria-label="Remove attachment"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardDetailSection>

            <CardDetailSection
                icon={CheckSquare}
                title="Checklist"
                accentColor={accentColor}
                action={
                    checklist.length > 0 ? (
                        <span className="text-xs text-slate-500">{completedCount}/{checklist.length}</span>
                    ) : undefined
                }
            >
                {checklist.length === 0 ? (
                    <CardDetailEmpty
                        icon={CheckSquare}
                        message={readOnly ? "No checklist items" : "Add items using the Checklist action"}
                    />
                ) : (
                    <>
                        <div className="mb-3">
                            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-green-500 transition-all duration-300"
                                    style={{ width: `${checklistProgress}%` }}
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            {checklist.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 group transition-colors duration-150"
                                >
                                    <button
                                        type="button"
                                        onClick={() => !readOnly && handleToggleChecklistItem(item.id, !item.completed)}
                                        disabled={readOnly}
                                        className={cn(
                                            "h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-all duration-150 active:scale-95",
                                            item.completed ? "bg-green-500 border-green-500" : "border-slate-400 hover:border-slate-600",
                                            !readOnly && "cursor-pointer"
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
                                            type="button"
                                            onClick={() => handleDeleteChecklistItem(item.id)}
                                            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-slate-400 hover:text-red-500 cursor-pointer transition-opacity duration-150"
                                            aria-label="Delete item"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </CardDetailSection>
        </div>
    );
}
