"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Globe, Lock, Users, Check } from "lucide-react";
import { toast } from "sonner";

import Modal from "@/components/ui/Modal";
import { Button, Input } from "@/components/ui";
import { useCreateBoardMutation } from "@/lib/api/boardApi";
import { parseApiError } from "@/utils/errorParser";
import { cn } from "@/utils/cn";

const PRESET_COLORS = [
    { value: "#0079BF", label: "Sky" },
    { value: "#4BBC4E", label: "Lime" },
    { value: "#FF9F1A", label: "Orange" },
    { value: "#EB5A46", label: "Red" },
    { value: "#C377E0", label: "Purple" },
    { value: "#FF78CB", label: "Pink" },
    { value: "#00C2E0", label: "Teal" },
    { value: "#0052CC", label: "Indigo" },
    { value: "#519839", label: "Green" },
    { value: "#B04632", label: "Crimson" },
];

const VISIBILITY_OPTIONS = [
    {
        value: "workspace",
        label: "Workspace",
        desc: "All workspace members can see and edit",
        icon: Users,
    },
    {
        value: "private",
        label: "Private",
        desc: "Only board members can see this board",
        icon: Lock,
    },
    {
        value: "public",
        label: "Public",
        desc: "Anyone with the link can view",
        icon: Globe,
    },
] as const;

const schema = z.object({
    name: z.string().min(1, "Board name is required").max(100, "Name is too long"),
});

type FormData = z.infer<typeof schema>;

interface Props {
    open: boolean;
    onClose: () => void;
    workspaceId: number;
}

export default function CreateBoardModal({ open, onClose, workspaceId }: Props) {
    const router = useRouter();
    const [createBoard, { isLoading }] = useCreateBoardMutation();
    const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0].value);
    const [visibility, setVisibility] = useState<"workspace" | "private" | "public">("workspace");

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<FormData>({ resolver: zodResolver(schema) });

    const nameValue = watch("name", "");

    const handleClose = () => {
        reset();
        setSelectedColor(PRESET_COLORS[0].value);
        setVisibility("workspace");
        onClose();
    };

    const onSubmit = async (data: FormData) => {
        try {
            const res = await createBoard({
                workspaceId,
                body: {
                    name: data.name,
                    background: selectedColor,
                    visibility,
                },
            }).unwrap();
            toast.success(`Board "${res.data!.name}" created`);
            handleClose();
            router.push(`/workspaces/${workspaceId}/boards/${res.data!.id}`);
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    return (
        <Modal open={open} onClose={handleClose} title="Create board" size="sm">
            {/* Board preview */}
            <div
                className="w-full h-24 rounded-xl mb-5 flex items-end p-3 transition-colors shadow-sm"
                style={{ backgroundColor: selectedColor }}
            >
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2">
                    <div className="h-1.5 w-16 bg-white/60 rounded" />
                </div>
                {nameValue && (
                    <p className="ml-2 text-white text-sm font-semibold drop-shadow-sm truncate flex-1">
                        {nameValue}
                    </p>
                )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                    label="Board name"
                    placeholder="e.g. Product Roadmap"
                    required
                    error={errors.name?.message}
                    autoFocus
                    {...register("name")}
                />

                {/* Color picker */}
                <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Background</p>
                    <div className="flex flex-wrap gap-2">
                        {PRESET_COLORS.map((c) => (
                            <button
                                key={c.value}
                                type="button"
                                onClick={() => setSelectedColor(c.value)}
                                className={cn(
                                    "relative h-8 w-10 rounded-md transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1",
                                    selectedColor === c.value && "ring-2 ring-offset-1 ring-blue-500"
                                )}
                                style={{ backgroundColor: c.value }}
                                title={c.label}
                            >
                                {selectedColor === c.value && (
                                    <Check className="h-3.5 w-3.5 text-white absolute inset-0 m-auto drop-shadow" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Visibility */}
                <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Visibility</p>
                    <div className="space-y-1.5">
                        {VISIBILITY_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setVisibility(opt.value)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all",
                                    visibility === opt.value
                                        ? "border-blue-300 bg-blue-50"
                                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                )}
                            >
                                <div className={cn(
                                    "flex items-center justify-center h-7 w-7 rounded-md shrink-0",
                                    visibility === opt.value ? "bg-blue-100" : "bg-slate-100"
                                )}>
                                    <opt.icon className={cn(
                                        "h-4 w-4",
                                        visibility === opt.value ? "text-blue-600" : "text-slate-500"
                                    )} />
                                </div>
                                <div className="min-w-0">
                                    <p className={cn(
                                        "text-sm font-medium",
                                        visibility === opt.value ? "text-blue-700" : "text-slate-800"
                                    )}>
                                        {opt.label}
                                    </p>
                                    <p className="text-xs text-slate-400 truncate">{opt.desc}</p>
                                </div>
                                {visibility === opt.value && (
                                    <Check className="h-4 w-4 text-blue-600 ml-auto shrink-0" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex gap-3 pt-1">
                    <Button type="button" variant="outline" fullWidth onClick={handleClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" fullWidth loading={isLoading}>
                        Create board
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
