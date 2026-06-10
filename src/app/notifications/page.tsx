"use client";
import { useState } from "react";
import Link from "next/link";
import {
    Bell,
    BellRing,
    Check,
    CheckCheck,
    Trash2,
    UserPlus,
    MessageSquare,
    Clock,
    AtSign,
    LayoutGrid,
    AlertTriangle,
    Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui";
import EmptyState from "@/components/ui/EmptyState";
import {
    useGetNotificationsQuery,
    useMarkReadMutation,
    useMarkAllReadMutation,
    useDeleteNotificationMutation,
    type Notification,
} from "@/lib/api/notificationApi";
import { parseApiError } from "@/utils/errorParser";
import { cn } from "@/utils/cn";

const TYPE_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
    card_assigned: { icon: UserPlus, color: "bg-blue-100 text-blue-600" },
    card_due_soon: { icon: Clock, color: "bg-amber-100 text-amber-600" },
    card_overdue: { icon: AlertTriangle, color: "bg-red-100 text-red-600" },
    card_moved: { icon: LayoutGrid, color: "bg-slate-100 text-slate-600" },
    card_commented: { icon: MessageSquare, color: "bg-purple-100 text-purple-600" },
    board_invite: { icon: UserPlus, color: "bg-emerald-100 text-emerald-600" },
    workspace_invite: { icon: UserPlus, color: "bg-emerald-100 text-emerald-600" },
    mention: { icon: AtSign, color: "bg-pink-100 text-pink-600" },
};

export default function NotificationsPage() {
    const [showUnreadOnly, setShowUnreadOnly] = useState(false);
    const { data, isLoading, isFetching } = useGetNotificationsQuery({
        page: 1,
        limit: 50,
        unreadOnly: showUnreadOnly,
    });

    const [markRead] = useMarkReadMutation();
    const [markAllRead, { isLoading: markingAll }] = useMarkAllReadMutation();
    const [deleteNotification] = useDeleteNotificationMutation();

    const notifications = data?.data ?? [];
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    const handleMarkRead = async (id: number) => {
        try { await markRead(id).unwrap(); }
        catch (err) { toast.error(parseApiError(err)); }
    };

    const handleMarkAll = async () => {
        try {
            const res = await markAllRead().unwrap();
            toast.success(`Marked ${res.data?.updated ?? 0} as read`);
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteNotification(id).unwrap();
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    return (
        <div className="min-h-full bg-slate-50">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-1">
                        <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-blue-50 text-blue-600">
                            {unreadCount > 0 ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-slate-900">Notifications</h1>
                            <p className="text-xs text-slate-500">
                                {unreadCount > 0
                                    ? `${unreadCount} unread`
                                    : "All caught up"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                            <button
                                onClick={() => setShowUnreadOnly(false)}
                                className={cn(
                                    "text-xs font-medium px-3 py-1.5 rounded-md transition-colors",
                                    !showUnreadOnly
                                        ? "bg-white text-slate-900 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setShowUnreadOnly(true)}
                                className={cn(
                                    "text-xs font-medium px-3 py-1.5 rounded-md transition-colors",
                                    showUnreadOnly
                                        ? "bg-white text-slate-900 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                Unread
                            </button>
                        </div>

                        {unreadCount > 0 && (
                            <Button
                                size="sm"
                                variant="outline"
                                leftIcon={<CheckCheck className="h-3.5 w-3.5" />}
                                onClick={handleMarkAll}
                                loading={markingAll}
                            >
                                <span className="hidden sm:inline">Mark all read</span>
                                <span className="sm:hidden">Read all</span>
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
                {isLoading ? (
                    <div className="space-y-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} className="h-16 rounded-xl" />
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <EmptyState
                        icon={<Bell className="h-6 w-6" />}
                        title={showUnreadOnly ? "No unread notifications" : "No notifications yet"}
                        description={
                            showUnreadOnly
                                ? "All caught up! New activity will appear here."
                                : "When teammates assign cards, comment, or invite you, notifications will appear here."
                        }
                    />
                ) : (
                    <div className="space-y-1.5">
                        {isFetching && !isLoading && (
                            <div className="flex justify-center py-2">
                                <Loader2 className="h-4 w-4 animate-spin text-slate-300" />
                            </div>
                        )}
                        {notifications.map((n) => (
                            <NotificationRow
                                key={n.id}
                                notification={n}
                                onMarkRead={handleMarkRead}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function NotificationRow({
    notification: n,
    onMarkRead,
    onDelete,
}: {
    notification: Notification;
    onMarkRead: (id: number) => void;
    onDelete: (id: number) => void;
}) {
    const iconInfo = TYPE_ICONS[n.type] ?? { icon: Bell, color: "bg-slate-100 text-slate-600" };
    const Icon = iconInfo.icon;

    // Build link target based on entity type
    let href: string | null = null;
    if (n.entityType === "card" || n.entityType === "comment") {
        // We don't have workspaceId/boardId here; can't directly link to card
        // Fall back to no link for now
        href = null;
    } else if (n.entityType === "board") {
        href = null; // would need workspace id
    } else if (n.entityType === "workspace") {
        href = `/workspaces/${n.entityId}`;
    }

    const content = (
        <>
            <div className={cn(
                "flex items-center justify-center h-9 w-9 rounded-lg shrink-0",
                iconInfo.color
            )}>
                <Icon className="h-4 w-4" />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <p className={cn(
                            "text-sm leading-snug",
                            n.isRead ? "text-slate-600" : "text-slate-900 font-medium"
                        )}>
                            {n.title}
                        </p>
                        {n.body && (
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-400">
                                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                            </span>
                            {n.actor && (
                                <>
                                    <span className="text-slate-300">·</span>
                                    <span className="text-[10px] text-slate-400">
                                        from {n.actor.name}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {!n.isRead && (
                        <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1.5" aria-label="Unread" />
                    )}
                </div>
            </div>

            <div className="flex items-center gap-1 shrink-0 self-start opacity-0 group-hover:opacity-100 transition-opacity">
                {!n.isRead && (
                    <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMarkRead(n.id); }}
                        className="flex items-center justify-center h-7 w-7 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Mark as read"
                    >
                        <Check className="h-3.5 w-3.5" />
                    </button>
                )}
                <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(n.id); }}
                    className="flex items-center justify-center h-7 w-7 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Delete"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            </div>
        </>
    );

    const baseClasses = cn(
        "group flex items-start gap-3 p-3 rounded-xl border transition-all",
        n.isRead
            ? "bg-white border-slate-200 hover:border-slate-300"
            : "bg-blue-50/50 border-blue-200 hover:border-blue-300"
    );

    if (href) {
        return (
            <Link
                href={href}
                onClick={() => { if (!n.isRead) onMarkRead(n.id); }}
                className={cn(baseClasses, "cursor-pointer hover:shadow-sm")}
            >
                {content}
            </Link>
        );
    }

    return (
        <div
            onClick={() => { if (!n.isRead) onMarkRead(n.id); }}
            className={cn(baseClasses, "cursor-pointer hover:shadow-sm")}
            role="button"
            tabIndex={0}
        >
            {content}
        </div>
    );
}
