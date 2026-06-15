"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

import Button from "@/components/ui/Button";
import { useVerifyEmailMutation } from "@/lib/api/authApi";
import { parseApiError } from "@/utils/errorParser";

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token") ?? "";
    const [verifyEmail, { isLoading, isSuccess, isError, error }] = useVerifyEmailMutation();
    const [attempted, setAttempted] = useState(false);

    useEffect(() => {
        if (!token || attempted) return;
        setAttempted(true);
        verifyEmail(token);
    }, [token, attempted, verifyEmail]);

    if (!token) {
        return (
            <div className="text-center">
                <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                <h1 className="text-xl font-bold text-slate-900 mb-2">Invalid verification link</h1>
                <p className="text-slate-500 text-sm mb-6">This link is missing a verification token.</p>
                <Link href="/profile">
                    <Button>Go to profile</Button>
                </Link>
            </div>
        );
    }

    if (isLoading || !attempted) {
        return (
            <div className="text-center">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-slate-600">Verifying your email…</p>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                <h1 className="text-xl font-bold text-slate-900 mb-2">Email verified</h1>
                <p className="text-slate-500 text-sm mb-6">Your email address has been confirmed successfully.</p>
                <Button onClick={() => router.push("/profile")}>Go to profile</Button>
            </div>
        );
    }

    return (
        <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-slate-900 mb-2">Verification failed</h1>
            <p className="text-slate-500 text-sm mb-6">
                {isError ? parseApiError(error) : "This link may have expired. Request a new one from your profile."}
            </p>
            <Link href="/profile">
                <Button>Go to profile</Button>
            </Link>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />}>
                    <VerifyEmailContent />
                </Suspense>
            </div>
        </div>
    );
}
