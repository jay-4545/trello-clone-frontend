// src/app/workspaces/create/page.tsx
"use client";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
    Briefcase,
    ArrowLeft,
    Sparkles,
    Users,
    LayoutGrid,
    Lock,
    Globe,
} from "lucide-react";

import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import { useCreateWorkspaceMutation } from "@/lib/api/workspaceApi";
import { parseApiError } from "@/utils/errorParser";

const schema = z.object({
    name: z
        .string()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name is too long"),
    description: z.string().max(500, "Description is too long").optional(),
});

type FormData = z.infer<typeof schema>;

const TEMPLATES = [
    { label: "Engineering", icon: "⚙️", desc: "Sprints, bugs, releases" },
    { label: "Marketing", icon: "📣", desc: "Campaigns, content, assets" },
    { label: "Design", icon: "🎨", desc: "Projects, reviews, handoffs" },
    { label: "General", icon: "📋", desc: "Flexible for any team" },
];

export default function CreateWorkspacePage() {
    const router = useRouter();
    const [createWorkspace, { isLoading }] = useCreateWorkspaceMutation();

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<FormData>({ resolver: zodResolver(schema) });

    const nameValue = watch("name", "");

    const onSubmit = async (data: FormData) => {
        try {
            const res = await createWorkspace(data).unwrap();
            toast.success(`Workspace "${res.data!.name}" created`);
            router.push(`/workspaces/${res.data!.id}`);
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    return (
        <div className="min-h-full bg-slate-50">
            {/* Top bar */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<ArrowLeft className="h-4 w-4" />}
                        onClick={() => router.push("/workspaces")}
                    >
                        Back
                    </Button>
                    <div className="h-4 w-px bg-slate-200" />
                    <h1 className="text-sm font-semibold text-slate-800">Create workspace</h1>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Form */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-2xl border border-slate-200 p-8">
                            <div className="mb-6">
                                <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-blue-50 mb-4">
                                    <Briefcase className="h-6 w-6 text-blue-600" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-900">
                                    Set up your workspace
                                </h2>
                                <p className="text-sm text-slate-500 mt-1">
                                    A workspace is a shared space where your team's boards live.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                <Input
                                    label="Workspace name"
                                    placeholder="e.g. Acme Marketing"
                                    required
                                    error={errors.name?.message}
                                    leftElement={<Briefcase className="h-4 w-4" />}
                                    hint="Pick a name your team will recognise."
                                    {...register("name")}
                                />

                                {/* Slug preview */}
                                {nameValue.length >= 2 && (
                                    <div className="flex items-center gap-2 -mt-2 px-1">
                                        <span className="text-xs text-slate-400">URL:</span>
                                        <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                            /workspaces/
                                            {nameValue
                                                .toLowerCase()
                                                .replace(/\s+/g, "-")
                                                .replace(/[^a-z0-9-]/g, "")}
                                        </span>
                                    </div>
                                )}

                                <Textarea
                                    label="Description"
                                    placeholder="What's this workspace for? (optional)"
                                    rows={3}
                                    error={errors.description?.message}
                                    hint="Help teammates understand the purpose of this space."
                                    {...register("description")}
                                />

                                {/* Quick-fill templates */}
                                <div>
                                    <p className="text-sm font-medium text-slate-700 mb-2">
                                        Quick-fill from template
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {TEMPLATES.map((tpl) => (
                                            <button
                                                key={tpl.label}
                                                type="button"
                                                onClick={() => {
                                                    setValue("name", tpl.label + " Team");
                                                    setValue("description", tpl.desc);
                                                }}
                                                className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                                            >
                                                <span className="text-xl">{tpl.icon}</span>
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-800">
                                                        {tpl.label}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400">{tpl.desc}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        fullWidth
                                        onClick={() => router.push("/workspaces")}
                                        disabled={isLoading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" fullWidth loading={isLoading}>
                                        Create workspace
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Right panel — what you get */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-white rounded-2xl border border-slate-200 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles className="h-4 w-4 text-amber-500" />
                                <h3 className="text-sm font-semibold text-slate-800">
                                    What you get
                                </h3>
                            </div>
                            <div className="space-y-3">
                                {[
                                    {
                                        icon: <LayoutGrid className="h-4 w-4 text-blue-500" />,
                                        title: "3 starter boards",
                                        desc: "To Do, In Progress, Done — ready to go.",
                                    },
                                    {
                                        icon: <Users className="h-4 w-4 text-emerald-500" />,
                                        title: "Invite your team",
                                        desc: "Add members with viewer, member, or admin roles.",
                                    },
                                    {
                                        icon: <Lock className="h-4 w-4 text-violet-500" />,
                                        title: "Role-based access",
                                        desc: "Control who can see and edit everything.",
                                    },
                                    {
                                        icon: <Globe className="h-4 w-4 text-slate-400" />,
                                        title: "Public or private boards",
                                        desc: "Boards inside can be workspace-wide or restricted.",
                                    },
                                ].map((item) => (
                                    <div key={item.title} className="flex items-start gap-3">
                                        <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-slate-50 shrink-0 mt-0.5">
                                            {item.icon}
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-slate-800">{item.title}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Preview card */}
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white">
                            <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-3">
                                Preview
                            </p>
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                                <div className="flex items-center gap-2.5 mb-3">
                                    <div
                                        className="h-7 w-7 rounded-md flex items-center justify-center text-white text-xs font-bold"
                                        style={{ background: "rgba(255,255,255,0.2)" }}
                                    >
                                        {nameValue ? nameValue[0].toUpperCase() : "W"}
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-white truncate max-w-[140px]">
                                            {nameValue || "Your workspace"}
                                        </p>
                                        <p className="text-[11px] text-blue-200">owner</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {["To Do", "In Progress", "Done"].map((col) => (
                                        <div key={col} className="flex-1">
                                            <div className="text-[10px] text-blue-200 font-medium mb-1 px-1">
                                                {col}
                                            </div>
                                            <div className="space-y-1">
                                                {[60, 80].map((w, i) => (
                                                    <div
                                                        key={i}
                                                        className="bg-white/15 rounded-md p-1.5"
                                                    >
                                                        <div
                                                            className="h-1.5 rounded bg-white/40"
                                                            style={{ width: `${w}%` }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}