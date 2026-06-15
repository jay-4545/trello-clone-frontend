"use client";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import {
    Camera,
    Lock,
    LogOut,
    Mail,
    User,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Eye,
    EyeOff,
    CalendarDays,
    Clock,
    Shield,
    KeyRound,
    Settings,
} from "lucide-react";
import { toast } from "sonner";

import { Button, Input } from "@/components/ui";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import RoleBadge from "@/components/roles/RoleBadge";
import { useAppDispatch } from "@/store";
import { performLogout } from "@/store/authSession";
import { useAuthToken } from "@/hooks/useAuthToken";
import {
    useGetProfileQuery,
    useLogoutMutation,
    useChangePasswordMutation,
    useUploadAvatarMutation,
    useSendVerificationEmailMutation,
} from "@/lib/api/authApi";
import { parseApiError } from "@/utils/errorParser";
import { cn } from "@/utils/cn";
import { isSystemAdmin } from "@/hooks/usePermissions";

const pwSchema = z
    .object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z
            .string()
            .min(8, "At least 8 characters")
            .regex(/[A-Z]/, "Must contain an uppercase letter")
            .regex(/[a-z]/, "Must contain a lowercase letter")
            .regex(/[0-9]/, "Must contain a digit")
            .regex(/[^A-Za-z0-9]/, "Must contain a special character"),
        confirmPassword: z.string().min(1, "Please confirm your new password"),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
        path: ["confirmPassword"],
        message: "Passwords do not match",
    });

type PwForm = z.infer<typeof pwSchema>;

type ProfileVariant = "app" | "admin";

const THEMES: Record<ProfileVariant, {
    banner: string;
    accent: string;
    accentBg: string;
    accentHover: string;
    iconBg: string;
    avatarFallback: string;
}> = {
    app: {
        banner: "from-blue-600 via-blue-700 to-indigo-700",
        accent: "bg-blue-600 hover:bg-blue-700",
        accentBg: "bg-blue-100 text-blue-600",
        accentHover: "disabled:bg-blue-400",
        iconBg: "bg-blue-100 text-blue-600",
        avatarFallback: "bg-blue-600",
    },
    admin: {
        banner: "from-violet-600 via-purple-700 to-indigo-800",
        accent: "bg-violet-600 hover:bg-violet-700",
        accentBg: "bg-violet-100 text-violet-600",
        accentHover: "disabled:bg-violet-400",
        iconBg: "bg-violet-100 text-violet-600",
        avatarFallback: "bg-violet-600",
    },
};

function formatDate(iso: string | null | undefined) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function formatDatetime(iso: string | null | undefined) {
    if (!iso) return "Never";
    return new Date(iso).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

const ADMIN_PERMISSIONS = [
    "View platform statistics and all entities",
    "Manage user roles and account status",
    "Browse workspaces, boards, cards, and comments",
    "Access admin panel without leaving admin context",
];

export default function ProfileSettings({ variant = "app" }: { variant?: ProfileVariant }) {
    const theme = THEMES[variant];
    const router = useRouter();
    const dispatch = useAppDispatch();

    const hasToken = useAuthToken();
    const { data: profileData, isLoading: loadingProfile } = useGetProfileQuery(undefined, { skip: !hasToken });
    const [logoutMutation, { isLoading: loggingOut }] = useLogoutMutation();
    const [changePassword, { isLoading: changingPw }] = useChangePasswordMutation();
    const [uploadAvatar, { isLoading: uploadingAvatar }] = useUploadAvatarMutation();
    const [sendVerificationEmail, { isLoading: sendingVerification }] = useSendVerificationEmailMutation();

    const user = profileData?.data;

    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);
    const [pwSuccess, setPwSuccess] = useState(false);
    const [pwError, setPwError] = useState<string | null>(null);
    const [logoutConfirm, setLogoutConfirm] = useState(false);

    const avatarInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<PwForm>({ resolver: zodResolver(pwSchema) });

    const handleLogout = async () => {
        await performLogout(dispatch, () => logoutMutation().unwrap());
        toast.success("Signed out successfully");
        router.replace("/login");
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File is too large. Max 5 MB allowed.");
            return;
        }
        const formData = new FormData();
        formData.append("avatar", file);
        try {
            await uploadAvatar(formData).unwrap();
            toast.success("Avatar updated!");
        } catch (err) {
            toast.error(parseApiError(err));
        }
        e.target.value = "";
    };

    const onPwSubmit = async (data: PwForm) => {
        setPwError(null);
        setPwSuccess(false);
        try {
            await changePassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            }).unwrap();
            setPwSuccess(true);
            reset();
            toast.success("Password changed! Please log in again.");
            setTimeout(async () => {
                await performLogout(dispatch);
                router.replace("/login");
            }, 2000);
        } catch (err) {
            setPwError(parseApiError(err));
        }
    };

    if (loadingProfile) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className={cn("h-8 w-8 animate-spin", variant === "admin" ? "text-violet-500" : "text-blue-500")} />
            </div>
        );
    }

    return (
        <div className={cn("space-y-6", variant === "admin" ? "w-full" : "max-w-4xl mx-auto")}>
            {/* Profile hero card */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className={cn("h-28 bg-gradient-to-r relative", theme.banner)}>
                    <div
                        className="absolute inset-0 opacity-20"
                        style={{
                            backgroundImage:
                                "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
                            backgroundSize: "30px 30px",
                        }}
                    />
                </div>

                <div className="px-6 pb-6">
                    <div className="relative inline-block -mt-12 mb-4">
                        <div className="h-24 w-24 rounded-2xl ring-4 ring-white shadow-lg overflow-hidden">
                            {user?.avatar ? (
                                <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                            ) : (
                                <div className={cn("h-full w-full flex items-center justify-center text-white text-3xl font-bold", theme.avatarFallback)}>
                                    {user?.name?.[0]?.toUpperCase() ?? "U"}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => avatarInputRef.current?.click()}
                            disabled={uploadingAvatar}
                            className={cn(
                                "absolute -bottom-1 -right-1 h-8 w-8 rounded-full text-white flex items-center justify-center shadow-md border-2 border-white transition-colors",
                                theme.accent,
                                theme.accentHover
                            )}
                            title="Change avatar"
                        >
                            {uploadingAvatar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                        </button>
                        <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="hidden"
                            onChange={handleAvatarChange}
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">{user?.name ?? "—"}</h2>
                            <p className="text-sm text-slate-500 mt-0.5">{user?.email}</p>
                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                                {user?.role && <RoleBadge role={user.role} scope="system" />}
                                {user?.isEmailVerified ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Verified
                                    </span>
                                ) : (
                                    <>
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                                            <AlertCircle className="h-3 w-3" />
                                            Unverified
                                        </span>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            loading={sendingVerification}
                                            onClick={async () => {
                                                try {
                                                    await sendVerificationEmail().unwrap();
                                                    toast.success("Verification email sent");
                                                } catch (err) {
                                                    toast.error(parseApiError(err));
                                                }
                                            }}
                                        >
                                            Resend verification
                                        </Button>
                                    </>
                                )}
                                <span className={cn(
                                    "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold",
                                    user?.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                                )}>
                                    {user?.isActive ? "Active" : "Inactive"}
                                </span>
                            </div>
                        </div>
                        {variant !== "admin" && (
                            <Button
                                variant="outline"
                                size="sm"
                                leftIcon={<LogOut className="h-3.5 w-3.5" />}
                                onClick={() => setLogoutConfirm(true)}
                                className="shrink-0"
                            >
                                Sign out
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Admin permissions card */}
            {variant === "admin" && isSystemAdmin(user?.role) && (
                <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 rounded-2xl p-6">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="h-10 w-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                            <Shield className="h-5 w-5 text-violet-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900">Administrator access</h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Your account has elevated privileges on this platform.
                            </p>
                        </div>
                    </div>
                    <ul className="grid sm:grid-cols-2 gap-2">
                        {ADMIN_PERMISSIONS.map((perm) => (
                            <li key={perm} className="flex items-start gap-2 text-xs text-slate-600">
                                <CheckCircle2 className="h-3.5 w-3.5 text-violet-500 shrink-0 mt-0.5" />
                                {perm}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Account details */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                    <div className={cn("flex items-center justify-center h-8 w-8 rounded-lg", theme.iconBg)}>
                        <Settings className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900">Account details</h3>
                </div>
                <div className={cn("grid gap-3", variant === "admin" ? "sm:grid-cols-2 xl:grid-cols-4" : "sm:grid-cols-2")}>
                    {[
                        { icon: User, label: "Full name", value: user?.name },
                        { icon: Mail, label: "Email address", value: user?.email },
                        { icon: CalendarDays, label: "Member since", value: formatDate(user?.createdAt) },
                        { icon: Clock, label: "Last login", value: formatDatetime(user?.lastLoginAt) },
                    ].map((item) => (
                        <div
                            key={item.label}
                            className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100"
                        >
                            <div className={cn("flex items-center justify-center h-8 w-8 rounded-lg shrink-0", theme.iconBg)}>
                                <item.icon className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-medium">{item.label}</p>
                                <p className="text-sm font-semibold text-slate-800 mt-0.5">{item.value ?? "—"}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Change password */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                    <div className={cn("flex items-center justify-center h-8 w-8 rounded-lg", theme.iconBg)}>
                        <KeyRound className="h-4 w-4" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900">Security</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Change your password. You will be signed out after a successful update.
                        </p>
                    </div>
                </div>

                {pwSuccess && (
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 mb-5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <p className="text-sm text-emerald-700">Password changed! Signing you out…</p>
                    </div>
                )}

                {pwError && (
                    <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 mb-5">
                        <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                        <p className="text-sm text-red-700">{pwError}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit(onPwSubmit)} noValidate className="space-y-4 max-w-lg">
                    <Input
                        label="Current password"
                        type={showCurrentPw ? "text" : "password"}
                        placeholder="Your current password"
                        required
                        error={errors.currentPassword?.message}
                        leftElement={<Lock className="h-4 w-4" />}
                        rightElement={
                            <button type="button" onClick={() => setShowCurrentPw((v) => !v)} className="text-slate-400 hover:text-slate-600">
                                {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        }
                        {...register("currentPassword")}
                    />
                    <Input
                        label="New password"
                        type={showNewPw ? "text" : "password"}
                        placeholder="8+ chars, upper, lower, digit, special"
                        required
                        error={errors.newPassword?.message}
                        leftElement={<Lock className="h-4 w-4" />}
                        rightElement={
                            <button type="button" onClick={() => setShowNewPw((v) => !v)} className="text-slate-400 hover:text-slate-600">
                                {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        }
                        {...register("newPassword")}
                    />
                    <Input
                        label="Confirm new password"
                        type={showConfirmPw ? "text" : "password"}
                        placeholder="Repeat new password"
                        required
                        error={errors.confirmPassword?.message}
                        leftElement={<Lock className="h-4 w-4" />}
                        rightElement={
                            <button type="button" onClick={() => setShowConfirmPw((v) => !v)} className="text-slate-400 hover:text-slate-600">
                                {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        }
                        {...register("confirmPassword")}
                    />
                    <Button type="submit" loading={changingPw} leftIcon={<Lock className="h-4 w-4" />}>
                        Update password
                    </Button>
                </form>
            </div>

            {/* Danger zone */}
            <div className="bg-white rounded-2xl border border-red-200 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-red-700 mb-1">Session</h3>
                <p className="text-xs text-slate-500 mb-4">
                    Signing out ends your current session on this device.
                </p>
                <Button
                    variant="danger"
                    size="sm"
                    leftIcon={<LogOut className="h-4 w-4" />}
                    onClick={() => setLogoutConfirm(true)}
                >
                    Sign out
                </Button>
            </div>

            <ConfirmDialog
                open={logoutConfirm}
                onClose={() => setLogoutConfirm(false)}
                onConfirm={async () => {
                    await handleLogout();
                    setLogoutConfirm(false);
                }}
                loading={loggingOut}
                title="Sign out?"
                description="You'll need to sign in again to access your account."
                confirmLabel="Sign out"
                cancelLabel="Stay signed in"
            />
        </div>
    );
}
