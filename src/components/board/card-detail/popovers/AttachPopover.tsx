"use client";
import { Button } from "@/components/ui";
import type { CardDetailActions } from "../useCardDetailActions";

interface Props {
    actions: CardDetailActions;
    onClose: () => void;
}

export default function AttachPopover({ actions, onClose }: Props) {
    const { attachmentInputRef, uploadingAttachment } = actions;

    return (
        <div className="space-y-3">
            <p className="text-xs text-[#5e6c84]">Attach a file from your computer</p>
            <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={uploadingAttachment}
                onClick={() => {
                    attachmentInputRef.current?.click();
                    onClose();
                }}
            >
                Choose a file
            </Button>
        </div>
    );
}
