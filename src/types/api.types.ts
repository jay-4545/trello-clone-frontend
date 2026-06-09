export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
    errors?: string[];
    meta?: PaginationMeta;
}

export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface PaginatedResponse<T> {
    items: T[];
    meta: PaginationMeta;
}