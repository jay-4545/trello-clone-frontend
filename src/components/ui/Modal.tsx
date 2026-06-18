// src/components/ui/Modal.tsx
"use client";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";
import Button from "./Button";

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    children: React.ReactNode;
    size?: "sm" | "md" | "lg" | "xl";
    hideCloseButton?: boolean;
    className?: string;
    containerClassName?: string;
}

const sizeMap = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
};

export default function Modal({
    open,
    onClose,
    title,
    description,
    children,
    size = "md",
    hideCloseButton = false,
    className,
    containerClassName,
}: ModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null);

    // Lock body scroll
    useEffect(() => {
        if (open) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (open) document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [open, onClose]);

    if (!open) return null;

    return createPortal(
        <div
            ref={overlayRef}
            data-confirm-dialog
            className={cn(
                "fixed inset-0 z-[100] flex items-start sm:items-center justify-center overflow-y-auto p-4 py-4",
                containerClassName
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-200"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Panel */}
            <div
                className={cn(
                    "relative w-full bg-white rounded-xl shadow-2xl animate-in zoom-in-95 fade-in-0 duration-200",
                    "flex flex-col max-h-[min(90dvh,calc(100dvh-2rem))]",
                    sizeMap[size],
                    className
                )}
            >
                {(title || !hideCloseButton) && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
                        <div>
                            {title && (
                                <h2 id="modal-title" className="text-base font-semibold text-slate-900">
                                    {title}
                                </h2>
                            )}
                            {description && (
                                <p className="text-sm text-slate-500 mt-0.5">{description}</p>
                            )}
                        </div>
                        {!hideCloseButton && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                aria-label="Close modal"
                                className="ml-4 shrink-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                )}
                <div className="px-6 py-5 overflow-y-auto flex-1 min-h-0">{children}</div>
            </div>
        </div>,
        document.body
    );
}