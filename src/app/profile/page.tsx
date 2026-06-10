// src/app/profile/page.tsx
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
    Shield,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Eye,
    EyeOff,
    CalendarDays,
    Clock,
} from "lucide-react";
import { toast } from "sonner";

import { Button, Input } from "@/components/ui";
import Avatar from "@/components/ui/Avatar";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import AppShell from "@/components/layout/AppShell";
import { useAppDispatch } from "@/store";
import { logout } from "@/store/slices/authSlice";
import {
    useGetProfileQuery,
    useLogoutMutation,
    useChangePasswordMutation,
    useUploadAvatarMutation,
} from "@/lib/api/authApi";
import { parseApiError } from "@/utils/errorParser";
import { cn } from "@/utils/cn";

// ─── Schemas ────────────────────────────────────────────────────────────────

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
    return (
        <AppShell>
            <ProfilePageContent />
        </AppShell>
    );
}

function ProfilePageContent() {
    const router = useRouter();
    const dispatch = useAppDispatch();

    const { data: profileData, isLoading: loadingProfile } = useGetProfileQuery();
    const [logoutMutation, { isLoading: loggingOut }] = useLogoutMutation();
    const [changePassword, { isLoading: changingPw }] = useChangePasswordMutation();
    const [uploadAvatar, { isLoading: uploadingAvatar }] = useUploadAvatarMutation();

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

    // ── Logout ──────────────────────────────────────────────────────────────
    const handleLogout = async () => {
        try {
            await logoutMutation().unwrap();
        } catch {
            // Ignore — always clear locally
        }
        dispatch(logout());
        toast.success("Signed out successfully");
        router.replace("/login");
    };

    // ── Avatar upload ────────────────────────────────────────────────────────
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
        // Reset input so same file can be re-selected
        e.target.value = "";
    };

    // ── Change password ──────────────────────────────────────────────────────
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
            setTimeout(() => {
                dispatch(logout());
                router.replace("/login");
            }, 2000);
        } catch (err) {
            setPwError(parseApiError(err));
        }
    };

    // ── Loading skeleton ─────────────────────────────────────────────────────
    if (loadingProfile) {
        return (
            <div className="flex items-center justify-center h-full min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="min-h-full bg-slate-50">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <h1 className="text-lg font-bold text-slate-900">Profile</h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Manage your account settings
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
                {/* ── Avatar & Info Card ───────────────────────────────────── */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    {/* Blue top banner */}
                    <div className="h-24 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 relative">
                        <div className="absolute inset-0 opacity-20"
                            style={{
                                backgroundImage:
                                    "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
                                backgroundSize: "30px 30px",
                            }}
                        />
                    </div>

                    <div className="px-6 pb-6">
                        {/* Avatar */}
                        <div className="relative inline-block -mt-10 mb-4">
                            <div className="h-20 w-20 rounded-2xl ring-4 ring-white shadow-md overflow-hidden">
                                {user?.avatar ? (
                                    <img
                                        src={user.avatar}
                                        alt={user.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center bg-blue-600 text-white text-2xl font-bold">
                                        {user?.name?.[0]?.toUpperCase() ?? "U"}
                                    </div>
                                )}
                            </div>
                            {/* Upload button */}
                            <button
                                onClick={() => avatarInputRef.current?.click()}
                                disabled={uploadingAvatar}
                                className="absolute -bottom-1.5 -right-1.5 h-7 w-7 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md border-2 border-white transition-colors disabled:bg-blue-400"
                                title="Change avatar"
                            >
                                {uploadingAvatar ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                    <Camera className="h-3 w-3" />
                                )}
                            </button>
                            <input
                                ref={avatarInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                className="hidden"
                                onChange={handleAvatarChange}
                            />
                        </div>

                        {/* Name & role */}
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">
                                    {user?.name ?? "—"}
                                </h2>
                                <p className="text-sm text-slate-500 mt-0.5">{user?.email}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span
                                        className={cn(
                                            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold",
                                            user?.role === "super_admin"
                                                ? "bg-purple-100 text-purple-700"
                                                : user?.role === "admin"
                                                    ? "bg-blue-100 text-blue-700"
                                                    : "bg-slate-100 text-slate-600"
                                        )}
                                    >
                                        <Shield className="h-3 w-3" />
                                        {user?.role === "super_admin"
                                            ? "Super Admin"
                                            : user?.role === "admin"
                                                ? "Admin"
                                                : "Member"}
                                    </span>
                                    {user?.isEmailVerified ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                            <CheckCircle2 className="h-3 w-3" />
                                            Verified
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                                            <AlertCircle className="h-3 w-3" />
                                            Unverified
                                        </span>
                                    )}
                                    {user?.isActive ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                            Active
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                            Inactive
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Sign out */}
                            <Button
                                variant="outline"
                                size="sm"
                                leftIcon={<LogOut className="h-3.5 w-3.5" />}
                                onClick={() => setLogoutConfirm(true)}
                                className="text-slate-600 shrink-0"
                            >
                                Sign out
                            </Button>
                        </div>
                    </div>
                </div>

                {/* ── Account details ───────────────────────────────────────── */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h3 className="text-sm font-semibold text-slate-900 mb-4">
                        Account details
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {[
                            {
                                icon: User,
                                label: "Full name",
                                value: user?.name,
                            },
                            {
                                icon: Mail,
                                label: "Email address",
                                value: user?.email,
                            },
                            {
                                icon: CalendarDays,
                                label: "Member since",
                                value: formatDate(user?.createdAt),
                            },
                            {
                                icon: Clock,
                                label: "Last login",
                                value: formatDatetime(user?.lastLoginAt),
                            },
                        ].map((item) => (
                            <div
                                key={item.label}
                                className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                            >
                                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-blue-100 text-blue-600 shrink-0 mt-0.5">
                                    <item.icon className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-medium">{item.label}</p>
                                    <p className="text-sm font-semibold text-slate-800 mt-0.5">
                                        {item.value ?? "—"}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Change Password ───────────────────────────────────────── */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-blue-100 text-blue-600">
                            <Lock className="h-4 w-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900">
                                Change password
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                                You will be signed out after a successful change.
                            </p>
                        </div>
                    </div>

                    {pwSuccess && (
                        <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-4 py-3 mb-5">
                            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                            <p className="text-sm text-green-700">
                                Password changed! Signing you out…
                            </p>
                        </div>
                    )}

                    {pwError && (
                        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 mb-5">
                            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                            <p className="text-sm text-red-700">{pwError}</p>
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit(onPwSubmit)}
                        noValidate
                        className="space-y-4"
                    >
                        <Input
                            label="Current password"
                            type={showCurrentPw ? "text" : "password"}
                            placeholder="Your current password"
                            required
                            error={errors.currentPassword?.message}
                            leftElement={<Lock className="h-4 w-4" />}
                            rightElement={
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPw((v) => !v)}
                                    className="text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showCurrentPw ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
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
                                <button
                                    type="button"
                                    onClick={() => setShowNewPw((v) => !v)}
                                    className="text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showNewPw ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
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
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPw((v) => !v)}
                                    className="text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showConfirmPw ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            }
                            {...register("confirmPassword")}
                        />

                        <div className="pt-1">
                            <Button
                                type="submit"
                                loading={changingPw}
                                leftIcon={<Lock className="h-4 w-4" />}
                            >
                                Update password
                            </Button>
                        </div>
                    </form>
                </div>

                {/* ── Danger zone ───────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl border border-red-200 p-6">
                    <h3 className="text-sm font-semibold text-red-700 mb-1">
                        Danger zone
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">
                        Signing out will end your current session on this device.
                    </p>
                    <Button
                        variant="danger"
                        size="sm"
                        leftIcon={<LogOut className="h-4 w-4" />}
                        onClick={() => setLogoutConfirm(true)}
                    >
                        Sign out of Taskboard
                    </Button>
                </div>
            </div>

            {/* Sign-out confirmation */}
            <ConfirmDialog
                open={logoutConfirm}
                onClose={() => setLogoutConfirm(false)}
                onConfirm={async () => {
                    await handleLogout();
                    setLogoutConfirm(false);
                }}
                loading={loggingOut}
                title="Sign out of Taskboard?"
                description="You'll need to sign in again to access your workspaces and boards."
                confirmLabel="Sign out"
                cancelLabel="Stay signed in"
            />
        </div>
    );
}
