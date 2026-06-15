// src/components/workspace/CreateWorkspaceModal.tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Briefcase } from "lucide-react";

import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import { useCreateWorkspaceMutation } from "@/lib/api/workspaceApi";
import { parseApiError } from "@/utils/errorParser";

const schema = z.object({
    name: z
        .string()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name is too long"),
    description: z.string().max(500, "Description is too long").optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
    open: boolean;
    onClose: () => void;
}

export default function CreateWorkspaceModal({ open, onClose }: Props) {
    const router = useRouter();
    const [createWorkspace, { isLoading }] = useCreateWorkspaceMutation();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<FormData>({ resolver: zodResolver(schema) });

    const onSubmit = async (data: FormData) => {
        try {
            const res = await createWorkspace(data).unwrap();
            toast.success(`Workspace "${res.data!.name}" created`);
            reset();
            onClose();
            router.push(`/workspaces/${res.data!.id}`);
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title="Create workspace"
            description="A workspace is where your team's boards live."
            size="md"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                    label="Workspace name"
                    placeholder="e.g. Marketing Team"
                    required
                    error={errors.name?.message}
                    leftElement={<Briefcase className="h-4 w-4" />}
                    {...register("name")}
                />

                <Textarea
                    label="Description"
                    placeholder="What's this workspace for? (optional)"
                    rows={3}
                    error={errors.description?.message}
                    {...register("description")}
                />

                <div className="flex gap-3 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        fullWidth
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" fullWidth loading={isLoading}>
                        Create workspace
                    </Button>
                </div>
            </form>
        </Modal>
    );
}