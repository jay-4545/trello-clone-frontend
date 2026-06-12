"use client";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Mail } from "lucide-react";

import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { useInviteWorkspaceMemberMutation } from "@/lib/api/workspaceApi";
import { WORKSPACE_INVITE_ROLES, toSelectOptions } from "@/types/role.types";
import { parseApiError } from "@/utils/errorParser";

const schema = z.object({
    email: z.string().email("Enter a valid email"),
    role: z.enum(["admin", "member", "viewer"]),
});

type FormData = z.infer<typeof schema>;

const ROLE_OPTIONS = toSelectOptions(WORKSPACE_INVITE_ROLES);

interface Props {
    open: boolean;
    onClose: () => void;
    workspaceId: number;
}

export default function InviteMemberModal({ open, onClose, workspaceId }: Props) {
    const [invite, { isLoading }] = useInviteWorkspaceMemberMutation();

    const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({
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

                <Controller
                    name="role"
                    control={control}
                    render={({ field }) => (
                        <Select
                            label="Role"
                            options={ROLE_OPTIONS}
                            value={field.value}
                            onChange={field.onChange}
                            error={errors.role?.message}
                        />
                    )}
                />

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
