import { cn } from "@/utils/cn";

export default function AdminPage({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return <div className={cn("w-full space-y-4", className)}>{children}</div>;
}
