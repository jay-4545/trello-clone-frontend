import { baseApi } from "./baseApi";
import type { ApiResponse, PaginationMeta } from "@/types/api.types";

export type TodoPriority = "low" | "medium" | "high";
export type TodoStatus = "pending" | "in_progress" | "completed";

export interface Todo {
    id: number;
    userId: number;
    title: string;
    description: string | null;
    status: TodoStatus;
    priority: TodoPriority;
    dueDate: string | null;
    createdAt: string;
}

export interface TodoStats {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
}

export const todoApi = baseApi.injectEndpoints({
    endpoints: (build) => ({

        getTodos: build.query<{ success: boolean; data: Todo[]; meta: PaginationMeta }, { status?: TodoStatus; priority?: TodoPriority; search?: string; page?: number; limit?: number }>({
            query: (params) => ({ url: "/todos", params }),
            providesTags: ["Todo"],
        }),

        getTodoById: build.query<ApiResponse<Todo>, number>({
            query: (id) => `/todos/${id}`,
            providesTags: (_r, _e, id) => [{ type: "Todo", id }],
        }),

        getTodoStats: build.query<ApiResponse<TodoStats>, void>({
            query: () => "/todos/stats",
            providesTags: ["Todo"],
        }),

        createTodo: build.mutation<ApiResponse<Todo>, { title: string; description?: string; priority?: TodoPriority; dueDate?: string }>({
            query: (body) => ({ url: "/todos", method: "POST", body }),
            invalidatesTags: ["Todo"],
        }),

        updateTodo: build.mutation<ApiResponse<Todo>, { id: number; body: Partial<{ title: string; description: string; status: TodoStatus; priority: TodoPriority; dueDate: string | null }> }>({
            query: ({ id, body }) => ({ url: `/todos/${id}`, method: "PUT", body }),
            invalidatesTags: (_r, _e, { id }) => [{ type: "Todo", id }, "Todo"],
        }),

        deleteTodo: build.mutation<ApiResponse<null>, number>({
            query: (id) => ({ url: `/todos/${id}`, method: "DELETE" }),
            invalidatesTags: ["Todo"],
        }),

    }),
    overrideExisting: false,
});

export const {
    useGetTodosQuery,
    useGetTodoByIdQuery,
    useGetTodoStatsQuery,
    useCreateTodoMutation,
    useUpdateTodoMutation,
    useDeleteTodoMutation,
} = todoApi;