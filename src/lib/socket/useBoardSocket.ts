import { useEffect } from "react";
import { setActiveBoard, teardownActiveBoard } from "./socketManager";

export function useBoardSocket(boardId: number | null | undefined) {
    useEffect(() => {
        if (!boardId || Number.isNaN(boardId)) return;

        setActiveBoard(boardId);

        return () => {
            teardownActiveBoard();
        };
    }, [boardId]);
}
