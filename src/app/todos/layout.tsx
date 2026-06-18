import AppShell from "@/components/layout/AppShell";

export default function TodosLayout({ children }: { children: React.ReactNode }) {
    return <AppShell>{children}</AppShell>;
}
