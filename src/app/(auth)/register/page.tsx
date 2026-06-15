// src/app/(auth)/register/page.tsx
import type { Metadata } from "next";
import RegisterForm from "@/components/auth/RegisterForm";
import { APP_NAME } from "@/lib/brand";

export const metadata: Metadata = {
    title: `Create Account | ${APP_NAME}`,
    description: "Create a new account",
};

export default function RegisterPage() {
    return <RegisterForm />;
}