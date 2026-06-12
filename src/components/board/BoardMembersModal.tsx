"use client";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, UserPlus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import Modal from "@/components/ui/Modal";
import { Button, Input, Select } from "@/components/ui";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import RoleBadge from "@/components/roles/RoleBadge";
import Avatar from "@/components/ui/Avatar";
import { BOARD_INVITE_ROLES, toSelectOptions } from "@/types/role.types";

const ROLE_OPTIONS = toSelectOptions(BOARD_INVITE_ROLES);
const ROLE_OPTIONS_COMPACT = BOARD_INVITE_ROLES.map((r) => ({ value: r.value, label: r.label }));
import {
    useGetBoardMembersQuery,
    useInviteBoardMemberMutation,
    useUpdateBoardMemberRoleMutation,
    useRemoveBoardMemberMutation,
} from "@/lib/api/boardApi";
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
    boardId: number;
    canManage: boolean;
    currentUserId?: number;
}

export default function BoardMembersModal({
    open,
    onClose,
    workspaceId,
    boardId,
    canManage,
    currentUserId,
}: Props) {
    const { data: membersData, isLoading } = useGetBoardMembersQuery(
        { workspaceId, boardId },
        { skip: !open }
    );
    const [inviteMember, { isLoading: inviting }] = useInviteBoardMemberMutation();
    const [updateRole] = useUpdateBoardMemberRoleMutation();
    const [removeMember] = useRemoveBoardMemberMutation();

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
                boardId,
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
            await updateRole({ workspaceId, boardId, userId, role }).unwrap();
            toast.success("Role updated");
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handleRemove = async () => {
        if (!removeTarget) return;
        try {
            await removeMember({ workspaceId, boardId, userId: removeTarget.userId }).unwrap();
            toast.success(`${removeTarget.name} removed`);
            setRemoveTarget(null);
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    return (
        <Modal open={open} onClose={onClose} title="Board members" size="lg">
            {/* Invite form */}
            {canManage && (
                <form onSubmit={handleSubmit(onInvite)} className="space-y-3 pb-5 border-b border-slate-200 mb-5">
                    <p className="text-sm font-semibold text-slate-700">Invite a member</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex-1">
                            <Input
                                placeholder="teammate@example.com"
                                type="email"
                                leftElement={<Mail className="h-4 w-4" />}
                                error={errors.email?.message}
                                {...register("email")}
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
                                    className="sm:w-44"
                                />
                            )}
                        />
                        <Button
                            type="submit"
                            loading={inviting}
                            leftIcon={<UserPlus className="h-4 w-4" />}
                        >
                            Invite
                        </Button>
                    </div>
                </form>
            )}

            {/* Members list */}
            <div>
                <p className="text-sm font-semibold text-slate-700 mb-3">
                    Members ({members.length})
                </p>

                {isLoading && (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
                    </div>
                )}

                {!isLoading && members.length === 0 && (
                    <div className="text-center py-8 text-sm text-slate-500">
                        No members yet
                    </div>
                )}

                <div className="space-y-2 max-h-72 overflow-y-auto">
                    {members.map((m) => {
                        const isSelf = currentUserId === m.userId;
                        return (
                            <div
                                key={m.id}
                                className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 bg-white"
                            >
                                <Avatar src={m.user.avatar} name={m.user.name} size="sm" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-800 truncate flex items-center gap-1.5">
                                        {m.user.name}
                                        {isSelf && (
                                            <span className="text-[10px] font-semibold uppercase text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                                You
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-xs text-slate-400 truncate">{m.user.email}</p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    {canManage && !isSelf ? (
                                        <Select
                                            options={ROLE_OPTIONS_COMPACT}
                                            value={m.role}
                                            onChange={(role) => handleRoleChange(m.userId, role)}
                                            size="sm"
                                            className="w-28"
                                        />
                                    ) : (
                                        <RoleBadge role={m.role} scope="board" />
                                    )}

                                    {canManage && !isSelf && (
                                        <button
                                            onClick={() => setRemoveTarget({ userId: m.userId, name: m.user.name })}
                                            className="flex items-center justify-center h-8 w-8 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                            aria-label="Remove member"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <ConfirmDialog
                open={!!removeTarget}
                onClose={() => setRemoveTarget(null)}
                onConfirm={handleRemove}
                title={`Remove ${removeTarget?.name}?`}
                description="They will lose access to this board."
                confirmLabel="Remove member"
                variant="danger"
            />
        </Modal>
    );
}
