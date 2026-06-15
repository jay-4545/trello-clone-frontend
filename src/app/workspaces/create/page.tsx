"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useAppDispatch } from "@/store";
import { setCreateWorkspaceModal } from "@/store/slices/uiSlice";

export default function CreateWorkspaceRedirectPage() {
    const router = useRouter();
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(setCreateWorkspaceModal(true));
        router.replace("/workspaces");
    }, [dispatch, router]);

    return (
        <div className="min-h-full bg-[#f0f2f5] flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
    );
}
