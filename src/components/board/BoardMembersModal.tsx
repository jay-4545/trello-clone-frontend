"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, UserPlus, Trash2, Shield, Loader2, Crown } from "lucide-react";
import { toast } from "sonner";

import Modal from "@/components/ui/Modal";
import { Button, Input } from "@/components/ui";
import {
    useGetBoardMembersQuery,
    useInviteBoardMemberMutation,
    useUpdateBoardMemberRoleMutation,
    useRemoveBoardMemberMutation,
} from "@/lib/api/boardApi";
import { parseApiError } from "@/utils/errorParser";
import { cn } from "@/utils/cn";

const ROLES = [
    { value: "admin", label: "Admin", desc: "Full board access" },
    { value: "member", label: "Member", desc: "Can edit cards and lists" },
    { value: "viewer", label: "Viewer", desc: "Read-only access" },
];

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

    const {
        register,
        handleSubmit,
        reset,
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

    const handleRemove = async (userId: number, name: string) => {
        if (!confirm(`Remove ${name} from this board?`)) return;
        try {
            await removeMember({ workspaceId, boardId, userId }).unwrap();
            toast.success(`${name} removed`);
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
                        <select
                            {...register("role")}
                            className="text-sm bg-white border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-32"
                        >
                            {ROLES.map((r) => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
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
                        const isAdmin = m.role === "admin";

                        return (
                            <div
                                key={m.id}
                                className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 bg-white"
                            >
                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                    {m.user.name[0].toUpperCase()}
                                </div>
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
                                        <select
                                            value={m.role}
                                            onChange={(e) => handleRoleChange(m.userId, e.target.value)}
                                            className="text-xs font-medium bg-white border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {ROLES.map((r) => (
                                                <option key={r.value} value={r.value}>{r.label}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <span className={cn(
                                            "inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded",
                                            isAdmin
                                                ? "bg-amber-100 text-amber-700"
                                                : "bg-slate-100 text-slate-600"
                                        )}>
                                            {isAdmin && <Crown className="h-3 w-3" />}
                                            {m.role}
                                        </span>
                                    )}

                                    {canManage && !isSelf && (
                                        <button
                                            onClick={() => handleRemove(m.userId, m.user.name)}
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
        </Modal>
    );
}
