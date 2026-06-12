"use client";
import AdminPage from "@/components/admin/AdminPage";
import NotificationsList from "@/components/notifications/NotificationsList";

export default function AdminNotificationsPage() {
    return (
        <AdminPage>
            <NotificationsList showHeader />
        </AdminPage>
    );
}
