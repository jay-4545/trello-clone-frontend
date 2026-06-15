"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Trash2, Archive, Check, Lock, Globe, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";

import Modal from "@/components/ui/Modal";
import { Button, Input, Textarea } from "@/components/ui";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
    useUpdateBoardMutation,
    useDeleteBoardMutation,
    useCloseBoardMutation,
} from "@/lib/api/boardApi";
import type { Board } from "@/lib/api/boardApi";
import { parseApiError } from "@/utils/errorParser";
import { cn } from "@/utils/cn";

const PRESET_COLORS = [
    { value: "#0079BF", label: "Sky" },
    { value: "#4BBC4E", label: "Lime" },
    { value: "#FF9F1A", label: "Orange" },
    { value: "#EB5A46", label: "Red" },
    { value: "#C377E0", label: "Purple" },
    { value: "#FF78CB", label: "Pink" },
    { value: "#00C2E0", label: "Teal" },
    { value: "#0052CC", label: "Indigo" },
    { value: "#519839", label: "Green" },
    { value: "#B04632", label: "Crimson" },
];

const VISIBILITY_OPTIONS = [
    { value: "workspace", label: "Workspace", icon: Users, desc: "All workspace members" },
    { value: "private", label: "Private", icon: Lock, desc: "Only board members" },
    { value: "public", label: "Public", icon: Globe, desc: "Anyone with the link" },
] as const;

const schema = z.object({
    name: z.string().min(1, "Board name is required").max(200, "Name too long"),
    description: z.string().max(1000, "Description too long").optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
    open: boolean;
    onClose: () => void;
    workspaceId: number;
    board: Board;
    canDelete: boolean;
}

export default function BoardSettingsModal({ open, onClose, workspaceId, board, canDelete }: Props) {
    const router = useRouter();
    const [updateBoard, { isLoading: updating }] = useUpdateBoardMutation();
    const [deleteBoard, { isLoading: deleting }] = useDeleteBoardMutation();
    const [closeBoard, { isLoading: closing }] = useCloseBoardMutation();

    const [confirmDelete, setConfirmDelete] = useState(false);
    const [confirmClose, setConfirmClose] = useState(false);
    const [selectedColor, setSelectedColor] = useState(board.background ?? "#0079BF");
    const [visibility, setVisibility] = useState(board.visibility);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isDirty },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: board.name,
            description: board.description ?? "",
        },
    });

    useEffect(() => {
        if (open) {
            reset({
                name: board.name,
                description: board.description ?? "",
            });
            setSelectedColor(board.background ?? "#0079BF");
            setVisibility(board.visibility);
        }
    }, [open, board, reset]);

    const onSubmit = async (data: FormData) => {
        try {
            await updateBoard({
                workspaceId,
                boardId: board.id,
                body: {
                    name: data.name,
                    description: data.description || null,
                    background: selectedColor,
                    visibility,
                },
            }).unwrap();
            toast.success("Board updated");
            onClose();
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handleDelete = async () => {
        try {
            await deleteBoard({ workspaceId, boardId: board.id }).unwrap();
            toast.success("Board deleted");
            setConfirmDelete(false);
            onClose();
            router.push(`/workspaces/${workspaceId}`);
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handleClose = async () => {
        try {
            await closeBoard({ workspaceId, boardId: board.id }).unwrap();
            toast.success("Board closed");
            setConfirmClose(false);
            onClose();
            router.push(`/workspaces/${workspaceId}`);
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const hasChanges = isDirty
        || selectedColor !== (board.background ?? "#0079BF")
        || visibility !== board.visibility;

    return (
        <>
            <Modal open={open} onClose={onClose} title="Board settings" size="lg">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* Preview */}
                    <div
                        className="w-full h-24 rounded-xl flex items-end p-3"
                        style={{ backgroundColor: selectedColor }}
                    >
                        <p className="text-white text-base font-bold drop-shadow-sm">
                            {board.name}
                        </p>
                    </div>

                    <Input
                        label="Board name"
                        required
                        error={errors.name?.message}
                        {...register("name")}
                    />

                    <Textarea
                        label="Description"
                        placeholder="What's this board about? (optional)"
                        rows={3}
                        error={errors.description?.message}
                        {...register("description")}
                    />

                    {/* Color picker */}
                    <div>
                        <p className="text-sm font-medium text-slate-700 mb-2">Background</p>
                        <div className="flex flex-wrap gap-2">
                            {PRESET_COLORS.map((c) => (
                                <button
                                    key={c.value}
                                    type="button"
                                    onClick={() => setSelectedColor(c.value)}
                                    className={cn(
                                        "relative h-9 w-12 rounded-md transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 cursor-pointer",
                                        selectedColor === c.value && "ring-2 ring-offset-1 ring-blue-500"
                                    )}
                                    style={{ backgroundColor: c.value }}
                                    title={c.label}
                                >
                                    {selectedColor === c.value && (
                                        <Check className="h-4 w-4 text-white absolute inset-0 m-auto drop-shadow" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Visibility */}
                    <div>
                        <p className="text-sm font-medium text-slate-700 mb-2">Visibility</p>
                        <div className="space-y-1.5">
                            {VISIBILITY_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setVisibility(opt.value)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all cursor-pointer",
                                        visibility === opt.value
                                            ? "border-blue-300 bg-blue-50"
                                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                    )}
                                >
                                    <div className={cn(
                                        "flex items-center justify-center h-7 w-7 rounded-md shrink-0",
                                        visibility === opt.value ? "bg-blue-100" : "bg-slate-100"
                                    )}>
                                        <opt.icon className={cn(
                                            "h-4 w-4",
                                            visibility === opt.value ? "text-blue-600" : "text-slate-500"
                                        )} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className={cn(
                                            "text-sm font-medium",
                                            visibility === opt.value ? "text-blue-700" : "text-slate-800"
                                        )}>{opt.label}</p>
                                        <p className="text-xs text-slate-400 truncate">{opt.desc}</p>
                                    </div>
                                    {visibility === opt.value && (
                                        <Check className="h-4 w-4 text-blue-600 ml-auto shrink-0" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            fullWidth
                            onClick={onClose}
                            disabled={updating}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            fullWidth
                            loading={updating}
                            disabled={!hasChanges}
                        >
                            Save changes
                        </Button>
                    </div>

                    {/* Danger zone */}
                    {canDelete && (
                        <div className="pt-4 border-t border-slate-200 space-y-1.5">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                Danger zone
                            </p>
                            <button
                                type="button"
                                onClick={() => setConfirmClose(true)}
                                disabled={closing}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 disabled:opacity-50"
                            >
                                {closing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
                                Close this board
                            </button>
                            <button
                                type="button"
                                onClick={() => setConfirmDelete(true)}
                                disabled={deleting}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 disabled:opacity-50"
                            >
                                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                Delete board permanently
                            </button>
                        </div>
                    )}
                </form>
            </Modal>

            <ConfirmDialog
                open={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirm={handleDelete}
                loading={deleting}
                title="Delete this board?"
                description={`"${board.name}" and all its lists, cards, and comments will be permanently deleted. This cannot be undone.`}
                confirmLabel="Delete board"
            />

            <ConfirmDialog
                open={confirmClose}
                onClose={() => setConfirmClose(false)}
                onConfirm={handleClose}
                loading={closing}
                title="Close this board?"
                description={`"${board.name}" will be archived. You can reopen it later from the workspace settings.`}
                confirmLabel="Close board"
            />
        </>
    );
}
