import { useState, useCallback, useMemo } from "react";

export interface TableState {
    page: number;
    limit: number;
    search: string;
    filters: Record<string, string>;
}

export function useTableState(initial?: Partial<TableState>) {
    const [page, setPage] = useState(initial?.page ?? 1);
    const [limit, setLimit] = useState(initial?.limit ?? 15);
    const [search, setSearch] = useState(initial?.search ?? "");
    const [filters, setFilters] = useState<Record<string, string>>(initial?.filters ?? {});

    const setFilter = useCallback((key: string, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setPage(1);
    }, []);

    const setSearchAndReset = useCallback((value: string) => {
        setSearch(value);
        setPage(1);
    }, []);

    const resetAll = useCallback(() => {
        setSearch("");
        setFilters({});
        setPage(1);
    }, []);

    const hasActiveFilters = useMemo(
        () => search.trim() !== "" || Object.values(filters).some((v) => v !== ""),
        [search, filters]
    );

    const queryParams = useMemo(() => {
        const params: Record<string, string | number> = { page, limit };
        if (search.trim()) params.search = search.trim();
        Object.entries(filters).forEach(([k, v]) => {
            if (v) params[k] = v;
        });
        return params;
    }, [page, limit, search, filters]);

    return {
        page,
        setPage,
        limit,
        setLimit,
        search,
        setSearch: setSearchAndReset,
        filters,
        setFilter,
        resetAll,
        hasActiveFilters,
        queryParams,
    };
}
