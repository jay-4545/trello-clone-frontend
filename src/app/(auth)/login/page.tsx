// src/app/(auth)/login/page.tsx
import type { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
    title: "Sign In | Trello Clone",
    description: "Sign in to your account",
};

export default function LoginPage() {
    return <LoginForm />;
}