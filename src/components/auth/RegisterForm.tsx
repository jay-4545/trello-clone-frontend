// src/components/auth/RegisterForm.tsx
"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, User, LayoutDashboard, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { Button, Input } from "@/components/ui";
import { useRegisterMutation } from "@/lib/api/authApi";
import { setCredentials } from "@/store/slices/authSlice";
import { useAppDispatch } from "@/store";
import { parseApiError } from "@/utils/errorParser";

const PASSWORD_RULES = [
    { label: "At least 8 characters", test: (v: string) => v.length >= 8 },
    { label: "Uppercase letter (A–Z)", test: (v: string) => /[A-Z]/.test(v) },
    { label: "Lowercase letter (a–z)", test: (v: string) => /[a-z]/.test(v) },
    { label: "Number (0–9)", test: (v: string) => /\d/.test(v) },
    { label: "Special character (!@#…)", test: (v: string) => /[\W_]/.test(v) },
];

const registerSchema = z.object({
    name: z
        .string()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name is too long"),
    email: z.string().email("Enter a valid email address"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Must contain an uppercase letter")
        .regex(/[a-z]/, "Must contain a lowercase letter")
        .regex(/\d/, "Must contain a number")
        .regex(/[\W_]/, "Must contain a special character"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterForm() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [registerUser, { isLoading }] = useRegisterMutation();
    const [showPassword, setShowPassword] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        mode: "onChange",
    });

    const passwordValue = watch("password", "");

    const onSubmit = async (data: RegisterFormData) => {
        setServerError(null);
        try {
            const res = await registerUser(data).unwrap();
            dispatch(
                setCredentials({
                    user: res.data!.user,
                    accessToken: res.data!.accessToken,
                    refreshToken: res.data!.refreshToken,
                })
            );
            toast.success("Account created! Welcome aboard 🎉");
            router.replace("/workspaces");
        } catch (err) {
            const msg = parseApiError(err);
            setServerError(msg);
        }
    };

    return (
        <div className="w-full max-w-sm mx-auto">
            {/* Logo */}
            <div className="flex flex-col items-center gap-3 mb-8">
                <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-blue-600 shadow-lg shadow-blue-200">
                    <LayoutDashboard className="h-6 w-6 text-white" />
                </div>
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-slate-900">Create account</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Start collaborating with your team
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                {/* Server error */}
                {serverError && (
                    <div
                        role="alert"
                        className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3"
                    >
                        <XCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                        <p className="text-sm text-red-700">{serverError}</p>
                    </div>
                )}

                <Input
                    label="Full name"
                    type="text"
                    placeholder="John Doe"
                    autoComplete="name"
                    required
                    error={errors.name?.message}
                    leftElement={<User className="h-4 w-4" />}
                    {...register("name")}
                />

                <Input
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    error={errors.email?.message}
                    leftElement={<Mail className="h-4 w-4" />}
                    {...register("email")}
                />

                <div className="space-y-2">
                    <Input
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        autoComplete="new-password"
                        required
                        error={errors.password?.message}
                        leftElement={<Lock className="h-4 w-4" />}
                        rightElement={
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        }
                        {...register("password")}
                    />

                    {/* Password strength checklist */}
                    {passwordValue.length > 0 && (
                        <div className="bg-slate-50 rounded-lg p-3 space-y-1.5">
                            {PASSWORD_RULES.map((rule) => {
                                const passed = rule.test(passwordValue);
                                return (
                                    <div key={rule.label} className="flex items-center gap-2">
                                        {passed ? (
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                        ) : (
                                            <XCircle className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                                        )}
                                        <span
                                            className={`text-xs ${passed ? "text-emerald-700" : "text-slate-400"
                                                }`}
                                        >
                                            {rule.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <Button
                    type="submit"
                    fullWidth
                    loading={isLoading}
                    size="lg"
                    className="mt-2"
                >
                    Create account
                </Button>

                <p className="text-xs text-slate-400 text-center">
                    By creating an account you agree to our terms and privacy policy.
                </p>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6">
                Already have an account?{" "}
                <Link
                    href="/login"
                    className="font-medium text-blue-600 hover:text-blue-700 underline underline-offset-2"
                >
                    Sign in
                </Link>
            </p>
        </div>
    );
}