// src/components/workspace/EditWorkspaceModal.tsx
"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Briefcase } from "lucide-react";

import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import { useUpdateWorkspaceMutation } from "@/lib/api/workspaceApi";
import { parseApiError } from "@/utils/errorParser";
import type { Workspace } from "@/lib/api/workspaceApi";

const schema = z.object({
    name: z.string().min(2, "At least 2 characters").max(100),
    description: z.string().max(500).optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
    open: boolean;
    onClose: () => void;
    workspace: Workspace;
}

export default function EditWorkspaceModal({ open, onClose, workspace }: Props) {
    const [updateWorkspace, { isLoading }] = useUpdateWorkspaceMutation();

    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    // Populate form when workspace changes
    useEffect(() => {
        if (open) {
            reset({
                name: workspace.name,
                description: workspace.description ?? "",
            });
        }
    }, [open, workspace, reset]);

    const onSubmit = async (data: FormData) => {
        try {
            await updateWorkspace({ id: workspace.id, body: data }).unwrap();
            toast.success("Workspace updated");
            onClose();
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Edit workspace"
            size="md"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                    label="Workspace name"
                    required
                    error={errors.name?.message}
                    leftElement={<Briefcase className="h-4 w-4" />}
                    {...register("name")}
                />
                <Textarea
                    label="Description"
                    placeholder="Optional description"
                    rows={3}
                    error={errors.description?.message}
                    {...register("description")}
                />
                <div className="flex gap-3 pt-2">
                    <Button variant="outline" fullWidth onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" fullWidth loading={isLoading}>
                        Save changes
                    </Button>
                </div>
            </form>
        </Modal>
    );
}