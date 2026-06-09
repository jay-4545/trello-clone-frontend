// src/app/(auth)/register/page.tsx
import type { Metadata } from "next";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
    title: "Create Account | Trello Clone",
    description: "Create a new account",
};

export default function RegisterPage() {
    return <RegisterForm />;
}