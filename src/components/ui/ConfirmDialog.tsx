// src/components/ui/ConfirmDialog.tsx
"use client";
import Modal from "./Modal";
import Button from "./Button";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    loading?: boolean;
    variant?: "danger" | "primary";
}

export default function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    loading = false,
    variant = "danger",
}: ConfirmDialogProps) {
    return (
        <Modal open={open} onClose={onClose} size="sm" hideCloseButton>
            <div className="flex flex-col items-center gap-4 text-center">
                <div
                    className={`flex items-center justify-center h-12 w-12 rounded-full ${variant === "danger" ? "bg-red-50" : "bg-blue-50"
                        }`}
                >
                    <AlertTriangle
                        className={`h-6 w-6 ${variant === "danger" ? "text-red-500" : "text-blue-500"
                            }`}
                    />
                </div>
                <div className="space-y-1">
                    <h3 className="text-base font-semibold text-slate-900">{title}</h3>
                    <p className="text-sm text-slate-500">{description}</p>
                </div>
                <div className="flex gap-3 w-full">
                    <Button
                        variant="outline"
                        fullWidth
                        onClick={onClose}
                        disabled={loading}
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={variant}
                        fullWidth
                        onClick={onConfirm}
                        loading={loading}
                    >
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}