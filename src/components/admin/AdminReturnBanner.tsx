"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface AdminReturnBannerProps {
    href: string;
    label?: string;
}

export default function AdminReturnBanner({
    href,
    label = "Back to admin",
}: AdminReturnBannerProps) {
    return (
        <div className="bg-violet-50 border-b border-violet-100 px-4 py-2">
            <Link
                href={href}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-700 hover:text-violet-900 transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                {label}
            </Link>
        </div>
    );
}
