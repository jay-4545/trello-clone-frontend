// src/components/workspace/InviteMemberModal.tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Mail } from "lucide-react";

import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useInviteWorkspaceMemberMutation } from "@/lib/api/workspaceApi";
import { parseApiError } from "@/utils/errorParser";

const schema = z.object({
    email: z.string().email("Enter a valid email"),
    role: z.enum(["admin", "member", "viewer"]),
});

type FormData = z.infer<typeof schema>;

interface Props {
    open: boolean;
    onClose: () => void;
    workspaceId: number;
}

export default function InviteMemberModal({ open, onClose, workspaceId }: Props) {
    const [invite, { isLoading }] = useInviteWorkspaceMemberMutation();

    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { role: "member" },
    });

    const onSubmit = async (data: FormData) => {
        try {
            await invite({ workspaceId, ...data }).unwrap();
            toast.success(`Invitation sent to ${data.email}`);
            reset();
            onClose();
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handleClose = () => { reset(); onClose(); };

    return (
        <Modal open={open} onClose={handleClose} title="Invite member" size="sm">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                    label="Email address"
                    type="email"
                    placeholder="colleague@company.com"
                    required
                    error={errors.email?.message}
                    leftElement={<Mail className="h-4 w-4" />}
                    {...register("email")}
                />

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">Role</label>
                    <select
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        {...register("role")}
                    >
                        <option value="viewer">Viewer — can only view boards</option>
                        <option value="member">Member — can create and edit</option>
                        <option value="admin">Admin — full workspace access</option>
                    </select>
                    {errors.role && (
                        <p className="text-xs text-red-500">{errors.role.message}</p>
                    )}
                </div>

                <div className="flex gap-3 pt-2">
                    <Button variant="outline" fullWidth onClick={handleClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" fullWidth loading={isLoading}>
                        Send invite
                    </Button>
                </div>
            </form>
        </Modal>
    );
}