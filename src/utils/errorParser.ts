interface BackendError {
    success: false;
    message: string;
    errors?: string[];
}

export function parseApiError(error: unknown): string {
    if (!error) return "An unexpected error occurred";

    // RTK Query FetchBaseQueryError
    if (typeof error === "object" && "data" in error) {
        const data = (error as { data: BackendError }).data;
        if (data?.message) return data.message;
        if (Array.isArray(data?.errors)) return data.errors.join(", ");
    }

    if (typeof error === "object" && "message" in error) {
        return (error as { message: string }).message;
    }

    return "An unexpected error occurred";
}