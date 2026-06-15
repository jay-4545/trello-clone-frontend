"use client";
import AppShell from "@/components/layout/AppShell";
import ProfileSettings from "@/components/profile/ProfileSettings";

export default function ProfilePage() {
    return (
        <AppShell>
            <div className="min-h-full bg-slate-50">
                <div className="sticky top-14 lg:top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
                        <h1 className="text-lg font-bold text-slate-900">Profile</h1>
                        <p className="text-sm text-slate-500 mt-0.5">Manage your account settings</p>
                    </div>
                </div>
                <div className="px-4 sm:px-6 py-8">
                    <ProfileSettings variant="app" />
                </div>
            </div>
        </AppShell>
    );
}
