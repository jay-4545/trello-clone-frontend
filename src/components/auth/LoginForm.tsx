// src/components/auth/LoginForm.tsx
"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { Button, Input } from "@/components/ui";
import { useLoginMutation } from "@/lib/api/authApi";
import { setCredentials } from "@/store/slices/authSlice";
import { useAppDispatch } from "@/store";
import { parseApiError } from "@/utils/errorParser";

const loginSchema = z.object({
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginForm() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [login, { isLoading }] = useLoginMutation();
    const [showPassword, setShowPassword] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginForm) => {
        setServerError(null);
        try {
            const res = await login(data).unwrap();
            dispatch(
                setCredentials({
                    user: res.data!.user,
                    accessToken: res.data!.accessToken,
                    refreshToken: res.data!.refreshToken,
                })
            );
            toast.success(`Welcome back, ${res.data!.user.name}!`);
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
                    <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Sign in to your workspace
                    </p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                {/* Server error banner */}
                {serverError && (
                    <div
                        role="alert"
                        className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3"
                    >
                        <svg
                            className="h-5 w-5 text-red-500 mt-0.5 shrink-0"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0v-4.5zm-.75 7.5a.75.75 0 100-1.5.75.75 0 000 1.5z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <p className="text-sm text-red-700">{serverError}</p>
                    </div>
                )}

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

                <Input
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Your password"
                    autoComplete="current-password"
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

                <Button
                    type="submit"
                    fullWidth
                    loading={isLoading}
                    size="lg"
                    className="mt-2"
                >
                    Sign in
                </Button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6">
                Don&apos;t have an account?{" "}
                <Link
                    href="/register"
                    className="font-medium text-blue-600 hover:text-blue-700 underline underline-offset-2"
                >
                    Create one
                </Link>
            </p>
        </div>
    );
}