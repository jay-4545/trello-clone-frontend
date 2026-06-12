"use client";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, UserPlus, Trash2, Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";

import Modal from "@/components/ui/Modal";
import { Button, Input, Select } from "@/components/ui";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import RoleBadge from "@/components/roles/RoleBadge";
import Avatar from "@/components/ui/Avatar";
import { WORKSPACE_INVITE_ROLES, toSelectOptions } from "@/types/role.types";

const ROLE_OPTIONS = toSelectOptions(WORKSPACE_INVITE_ROLES);
const ROLE_OPTIONS_COMPACT = WORKSPACE_INVITE_ROLES.map((r) => ({ value: r.value, label: r.label }));
import {
    useGetWorkspaceMembersQuery,
    useInviteWorkspaceMemberMutation,
    useUpdateWorkspaceMemberRoleMutation,
    useRemoveWorkspaceMemberMutation,
} from "@/lib/api/workspaceApi";
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
    canManage: boolean;
    currentUserId?: number;
    ownerId?: number;
}

export default function WorkspaceMembersModal({
    open,
    onClose,
    workspaceId,
    canManage,
    currentUserId,
    ownerId,
}: Props) {
    const { data: membersData, isLoading } = useGetWorkspaceMembersQuery(workspaceId, { skip: !open });
    const [inviteMember, { isLoading: inviting }] = useInviteWorkspaceMemberMutation();
    const [updateRole] = useUpdateWorkspaceMemberRoleMutation();
    const [removeMember] = useRemoveWorkspaceMemberMutation();

    const members = membersData?.data ?? [];
    const [removeTarget, setRemoveTarget] = useState<{ userId: number; name: string } | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        control,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { role: "member" },
    });

    const onInvite = async (data: FormData) => {
        try {
            await inviteMember({
                workspaceId,
                email: data.email,
                role: data.role,
            }).unwrap();
            toast.success(`Invitation sent to ${data.email}`);
            reset({ email: "", role: "member" });
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handleRoleChange = async (userId: number, role: string) => {
        try {
            await updateRole({ workspaceId, userId, role }).unwrap();
            toast.success("Role updated");
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handleRemove = async () => {
        if (!removeTarget) return;
        try {
            await removeMember({ workspaceId, userId: removeTarget.userId }).unwrap();
            toast.success(`${removeTarget.name} removed`);
            setRemoveTarget(null);
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    return (
        <Modal open={open} onClose={onClose} title="Workspace members" size="md">
            {canManage && (
                <form onSubmit={handleSubmit(onInvite)} className="mb-6 space-y-3">
                    <p className="text-sm text-slate-600">Invite a registered user by email.</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex-1">
                            <Input
                                {...register("email")}
                                placeholder="email@example.com"
                                leftElement={<Mail className="h-4 w-4" />}
                                error={errors.email?.message}
                            />
                        </div>
                        <Controller
                            name="role"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    options={ROLE_OPTIONS}
                                    value={field.value}
                                    onChange={field.onChange}
                                    className="sm:w-48"
                                />
                            )}
                        />
                        <Button type="submit" loading={inviting} leftIcon={<UserPlus className="h-4 w-4" />}>
                            Invite
                        </Button>
                    </div>
                </form>
            )}

            {isLoading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
                </div>
            ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                    {members.map((m) => {
                        const isOwner = m.userId === ownerId;
                        const isSelf = m.userId === currentUserId;
                        return (
                            <div
                                key={m.id}
                                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white"
                            >
                                <Avatar src={m.user.avatar} name={m.user.name} size="sm" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium text-slate-900 truncate">
                                            {m.user.name}
                                            {isSelf && <span className="text-slate-400 font-normal"> (you)</span>}
                                        </p>
                                        {isOwner && <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                                    </div>
                                    <p className="text-xs text-slate-500 truncate">{m.user.email}</p>
                                </div>
                                {canManage && !isOwner ? (
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Select
                                            options={ROLE_OPTIONS_COMPACT}
                                            value={m.role}
                                            onChange={(role) => handleRoleChange(m.userId, role)}
                                            size="sm"
                                            className="w-28"
                                        />
                                        {!isSelf && (
                                            <button
                                                onClick={() => setRemoveTarget({ userId: m.userId, name: m.user.name })}
                                                className="text-slate-400 hover:text-red-500 p-1"
                                                aria-label="Remove member"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <RoleBadge role={m.role} scope="workspace" />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
            <ConfirmDialog
                open={!!removeTarget}
                onClose={() => setRemoveTarget(null)}
                onConfirm={handleRemove}
                title={`Remove ${removeTarget?.name}?`}
                description="They will lose access to all boards in this workspace."
                confirmLabel="Remove member"
                variant="danger"
            />
        </Modal>
    );
}
