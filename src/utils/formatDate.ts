import { format } from "date-fns";

export function formatDate(value?: string | null, pattern = "MMM d, yyyy") {
    if (!value) return "—";
    try {
        return format(new Date(value), pattern);
    } catch {
        return "—";
    }
}
