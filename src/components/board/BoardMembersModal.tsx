"use client";
import { useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Mail,
    UserPlus,
    Trash2,
    Search,
    Users,
    Shield,
    MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";

import Modal from "@/components/ui/Modal";
import { Button, Input, Select } from "@/components/ui";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import RoleBadge from "@/components/roles/RoleBadge";
import Avatar from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BOARD_INVITE_ROLES, toSelectOptions } from "@/types/role.types";
import {
    useGetBoardMembersQuery,
    useInviteBoardMemberMutation,
    useUpdateBoardMemberRoleMutation,
    useRemoveBoardMemberMutation,
} from "@/lib/api/boardApi";
import { parseApiError } from "@/utils/errorParser";
import { cn } from "@/utils/cn";

const ROLE_OPTIONS = toSelectOptions(BOARD_INVITE_ROLES);
const ROLE_OPTIONS_COMPACT = BOARD_INVITE_ROLES.map((r) => ({ value: r.value, label: r.label }));

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
    const [search, setSearch] = useState("");
    const [removeTarget, setRemoveTarget] = useState<{ userId: number; name: string } | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        control,
        watch,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { role: "member" },
    });

    const selectedInviteRole = watch("role");
    const roleDescription = BOARD_INVITE_ROLES.find((r) => r.value === selectedInviteRole)?.desc;

    const filteredMembers = useMemo(() => {
        const q = search.trim().toLowerCase();
        const list = q
            ? members.filter(
                  (m) =>
                      m.user.name.toLowerCase().includes(q) ||
                      m.user.email.toLowerCase().includes(q)
              )
            : members;

        return [...list].sort((a, b) => a.user.name.localeCompare(b.user.name));
    }, [members, search]);

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

    const handleClose = () => {
        setSearch("");
        onClose();
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title="Manage members"
            description={`${members.length} member${members.length !== 1 ? "s" : ""} on this board`}
            size="lg"
        >
            {canManage && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-blue-100 text-blue-600">
                            <UserPlus className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-800">Invite by email</p>
                            <p className="text-xs text-slate-500">Add someone to this board only</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit(onInvite)} className="space-y-3">
                        <Input
                            {...register("email")}
                            label="Email address"
                            type="email"
                            placeholder="colleague@company.com"
                            leftElement={<Mail className="h-4 w-4" />}
                            error={errors.email?.message}
                        />

                        <div className="flex flex-col sm:flex-row sm:items-end gap-2">
                            <Controller
                                name="role"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        label="Role"
                                        options={ROLE_OPTIONS}
                                        value={field.value}
                                        onChange={field.onChange}
                                        className="flex-1 min-w-0"
                                    />
                                )}
                            />
                            <Button
                                type="submit"
                                loading={inviting}
                                leftIcon={<UserPlus className="h-4 w-4" />}
                                className="w-full sm:w-auto shrink-0"
                            >
                                Send invite
                            </Button>
                        </div>

                        {roleDescription && (
                            <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                <Shield className="h-3 w-3 shrink-0" />
                                {roleDescription}
                            </p>
                        )}
                    </form>
                </div>
            )}

            <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-slate-400" />
                        <h3 className="text-sm font-semibold text-slate-700">Members</h3>
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            {filteredMembers.length}
                        </span>
                    </div>
                    {members.length > 3 && (
                        <div className="w-44 sm:w-52">
                            <Input
                                placeholder="Search members…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                leftElement={<Search className="h-3.5 w-3.5" />}
                            />
                        </div>
                    )}
                </div>

                {isLoading && (
                    <div className="space-y-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <MemberRowSkeleton key={i} />
                        ))}
                    </div>
                )}

                {!isLoading && filteredMembers.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                        <Users className="h-8 w-8 text-slate-300 mb-2" />
                        <p className="text-sm font-medium text-slate-600">
                            {search ? "No members match your search" : "No members yet"}
                        </p>
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                                className="text-xs text-blue-600 hover:text-blue-700 mt-1 cursor-pointer"
                            >
                                Clear search
                            </button>
                        )}
                    </div>
                )}

                {!isLoading && filteredMembers.length > 0 && (
                    <div className="space-y-2 max-h-[min(50dvh,320px)] overflow-y-auto pr-0.5">
                        {filteredMembers.map((m) => (
                            <MemberRow
                                key={m.id}
                                name={m.user.name}
                                email={m.user.email}
                                avatar={m.user.avatar}
                                role={m.role}
                                isSelf={m.userId === currentUserId}
                                canManage={canManage}
                                onRoleChange={(role) => handleRoleChange(m.userId, role)}
                                onRemove={() => setRemoveTarget({ userId: m.userId, name: m.user.name })}
                            />
                        ))}
                    </div>
                )}
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

function MemberRow({
    name,
    email,
    avatar,
    role,
    isSelf,
    canManage,
    onRoleChange,
    onRemove,
}: {
    name: string;
    email: string;
    avatar: string | null;
    role: string;
    isSelf: boolean;
    canManage: boolean;
    onRoleChange: (role: string) => void;
    onRemove: () => void;
}) {
    const showRoleSelect = canManage && !isSelf;
    const showRemove = canManage && !isSelf;

    return (
        <div className="group flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all">
            <Avatar src={avatar} name={name} size="md" />

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-slate-900 truncate">{name}</p>
                    {isSelf && (
                        <span className="text-[10px] font-semibold uppercase text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded shrink-0">
                            You
                        </span>
                    )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 break-all sm:truncate" title={email}>
                    {email}
                </p>
            </div>

            <div className="hidden sm:flex items-center gap-2 shrink-0">
                {showRoleSelect ? (
                    <Select
                        options={ROLE_OPTIONS_COMPACT}
                        value={role}
                        onChange={onRoleChange}
                        size="sm"
                        className="w-28"
                    />
                ) : (
                    <RoleBadge role={role} scope="board" />
                )}
                {showRemove && (
                    <button
                        type="button"
                        onClick={onRemove}
                        className="flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                        aria-label={`Remove ${name}`}
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                )}
            </div>

            {showRoleSelect && (
                <div className="sm:hidden shrink-0">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="flex items-center justify-center h-8 w-8 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer outline-none"
                                aria-label="Member actions"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[180px]">
                            {ROLE_OPTIONS_COMPACT.map((opt) => (
                                <DropdownMenuItem
                                    key={opt.value}
                                    onSelect={() => onRoleChange(opt.value)}
                                    className={cn(role === opt.value && "bg-slate-50 font-medium")}
                                >
                                    Set as {opt.label}
                                </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onSelect={onRemove}
                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                Remove member
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}

            {!showRoleSelect && (
                <div className="sm:hidden shrink-0">
                    <RoleBadge role={role} scope="board" />
                </div>
            )}
        </div>
    );
}

function MemberRowSkeleton() {
    return (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-8 w-28 rounded-lg shrink-0" />
        </div>
    );
}
