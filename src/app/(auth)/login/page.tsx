import type { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";
import { APP_NAME } from "@/lib/brand";

export const metadata: Metadata = {
    title: `Sign In | ${APP_NAME}`,
    description: "Sign in to your account",
};

export default function LoginPage() {
    return <LoginForm />;
}