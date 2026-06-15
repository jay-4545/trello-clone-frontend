"use client";
import NotificationsList from "@/components/notifications/NotificationsList";

export default function NotificationsPage() {
    return (
        <div className="min-h-full bg-slate-50">
            <div className="sticky top-14 lg:top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
                    <h1 className="text-base font-bold text-slate-900">Notifications</h1>
                </div>
            </div>
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
                <NotificationsList showHeader />
            </div>
        </div>
    );
}
