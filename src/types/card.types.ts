export type CardPriority = "critical" | "high" | "medium" | "low";
export type CardStatus = "open" | "in_progress" | "in_review" | "done" | "archived";

export interface ChecklistItem {
    id: string;
    text: string;
    completed: boolean;
}

export interface CardAssignee {
    id: number;
    cardId: number;
    userId: number;
    user: { id: number; name: string; email: string; avatar: string | null };
}

export interface Card {
    id: number;
    listId: number;
    boardId: number;
    createdById: number;
    title: string;
    description: string | null;
    status: CardStatus;
    priority: CardPriority;
    position: number;
    dueDate: string | null;
    startDate: string | null;
    completedAt: string | null;
    labels: string[];
    tags: string[];
    checklist: ChecklistItem[];
    attachments: string[];
    coverImage: string | null;
    estimateHours: number | null;
    isArchived: boolean;
    isWatched: boolean;
    creator?: { id: number; name: string; email: string; avatar: string | null };
    assignees?: CardAssignee[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateCardInput {
    title: string;
    description?: string;
    priority?: CardPriority;
    dueDate?: string;
    labels?: string[];
    tags?: string[];
}

export interface UpdateCardInput {
    title?: string;
    description?: string | null;
    status?: CardStatus;
    priority?: CardPriority;
    dueDate?: string | null;
    startDate?: string | null;
    labels?: string[];
    tags?: string[];
    estimateHours?: number | null;
    coverImage?: string | null;
}

export interface MoveCardInput {
    targetListId: number;
    position?: number;
}

export interface BulkMoveInput {
    cardIds: number[];
    targetListId: number;
}

export interface CardStats {
    total: number;
    byStatus: Array<{ status: CardStatus; count: number }>;
    overdue: number;
    doneThisWeek: number;
}