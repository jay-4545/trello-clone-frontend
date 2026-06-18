import type { Card } from "@/types/card.types";
import type { BoardTheme } from "@/lib/boardTheme";

export interface BoardListOption {
    id: number;
    name: string;
}

export interface CardDetailModalProps {
    open: boolean;
    onClose: () => void;
    workspaceId: number;
    boardId: number;
    boardColor: string;
    card: Card | null;
    lists?: BoardListOption[];
    readOnly?: boolean;
    onCardUpdate?: (card: Card) => void;
    onCardDeleted?: (cardId: number) => void;
}

export interface CardDetailContext {
    card: Card;
    listId: number;
    workspaceId: number;
    boardId: number;
    theme: BoardTheme;
    readOnly: boolean;
    currentListName: string;
    lists: BoardListOption[];
    commentCount: number;
    onCardUpdate?: (card: Card) => void;
    onCardDeleted?: (cardId: number) => void;
    onClose: () => void;
}
