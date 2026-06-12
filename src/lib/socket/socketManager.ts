import type { AppDispatch } from "@/store";
import { baseApi } from "@/lib/api/baseApi";
import { token } from "@/utils/token";
import { connectSocket, getSocket, joinBoard, leaveBoard } from "./socketClient";
import { BOARD_SOCKET_EVENTS, NOTIFICATION_SOCKET_EVENT } from "./socketEvents";

let dispatchRef: AppDispatch | null = null;
let listenersReady = false;
let activeBoardId: number | null = null;
let boardInvalidateTimer: ReturnType<typeof setTimeout> | null = null;
let notifInvalidateTimer: ReturnType<typeof setTimeout> | null = null;

type PendingBoardTags = {
    list: boolean;
    board: boolean;
    members: boolean;
    cardIds: Set<number>;
    commentCardIds: Set<number>;
};

let pendingBoardTags: PendingBoardTags = {
    list: false,
    board: false,
    members: false,
    cardIds: new Set(),
    commentCardIds: new Set(),
};

function flushBoardInvalidation() {
    if (!dispatchRef || activeBoardId == null) return;

    const tags: Parameters<typeof baseApi.util.invalidateTags>[0] = [];

    if (pendingBoardTags.list) {
        tags.push({ type: "List", id: activeBoardId });
    }
    if (pendingBoardTags.board) {
        tags.push({ type: "Board", id: activeBoardId });
    }
    if (pendingBoardTags.members) {
        tags.push({ type: "BoardMember", id: activeBoardId });
    }
    pendingBoardTags.cardIds.forEach((id) => tags.push({ type: "Card", id }));
    pendingBoardTags.commentCardIds.forEach((id) => tags.push({ type: "Comment", id }));

    pendingBoardTags = {
        list: false,
        board: false,
        members: false,
        cardIds: new Set(),
        commentCardIds: new Set(),
    };

    if (tags.length > 0) {
        dispatchRef(baseApi.util.invalidateTags(tags));
    }
}

function scheduleBoardInvalidate(update: Partial<PendingBoardTags> & {
    cardId?: number;
    commentCardId?: number;
}) {
    if (update.list) pendingBoardTags.list = true;
    if (update.board) pendingBoardTags.board = true;
    if (update.members) pendingBoardTags.members = true;
    if (update.cardId != null) pendingBoardTags.cardIds.add(update.cardId);
    if (update.commentCardId != null) pendingBoardTags.commentCardIds.add(update.commentCardId);

    if (boardInvalidateTimer) clearTimeout(boardInvalidateTimer);
    boardInvalidateTimer = setTimeout(() => {
        flushBoardInvalidation();
        boardInvalidateTimer = null;
    }, 300);
}

function scheduleNotificationInvalidate() {
    if (!dispatchRef) return;
    if (notifInvalidateTimer) clearTimeout(notifInvalidateTimer);
    notifInvalidateTimer = setTimeout(() => {
        dispatchRef?.(baseApi.util.invalidateTags(["Notification"]));
        notifInvalidateTimer = null;
    }, 300);
}

function extractCardId(payload: unknown): number | undefined {
    if (!payload || typeof payload !== "object") return undefined;
    const p = payload as Record<string, unknown>;
    if (typeof p.cardId === "number") return p.cardId;
    if (p.card && typeof p.card === "object" && typeof (p.card as { id?: number }).id === "number") {
        return (p.card as { id: number }).id;
    }
    return undefined;
}

function extractCommentCardId(payload: unknown): number | undefined {
    if (!payload || typeof payload !== "object") return undefined;
    const p = payload as Record<string, unknown>;
    if (typeof p.cardId === "number") return p.cardId;
    if (p.comment && typeof p.comment === "object" && typeof (p.comment as { cardId?: number }).cardId === "number") {
        return (p.comment as { cardId: number }).cardId;
    }
    return undefined;
}

function onBoardEvent(event: string, payload: unknown) {
    if (activeBoardId == null) return;

    const cardId = extractCardId(payload);
    const isComment = event.startsWith("comment:");
    const isMember = event.startsWith("board:member");
    const isBoardMeta = event === "board:updated";

    scheduleBoardInvalidate({
        list: !isComment && !isMember && !isBoardMeta,
        board: isBoardMeta,
        members: isMember,
        cardId: cardId,
        commentCardId: isComment ? extractCommentCardId(payload) : undefined,
    });
}

function onSocketReconnect() {
    if (activeBoardId != null) {
        joinBoard(activeBoardId);
    }
}

function ensureListeners() {
    if (listenersReady || !dispatchRef) return;

    const socket = connectSocket();
    if (!socket) return;

    BOARD_SOCKET_EVENTS.forEach((event) => {
        const handler = (payload: unknown) => onBoardEvent(event, payload);
        socket.off(event, handler);
        socket.on(event, handler);
    });

    socket.off(NOTIFICATION_SOCKET_EVENT, scheduleNotificationInvalidate);
    socket.on(NOTIFICATION_SOCKET_EVENT, scheduleNotificationInvalidate);

    socket.off("connect", onSocketReconnect);
    socket.on("connect", onSocketReconnect);

    listenersReady = true;
}

/** Call once from AppShell with Redux dispatch */
export function initSocketSync(dispatch: AppDispatch) {
    if (!token.getAccess()) return;
    dispatchRef = dispatch;
    ensureListeners();
    connectSocket();
}

/** Track which board room the user is viewing */
export function setActiveBoard(boardId: number | null) {
    const prev = activeBoardId;
    activeBoardId = boardId;

    if (!dispatchRef) return;

    ensureListeners();

    if (prev != null && prev !== boardId) {
        leaveBoard(prev);
    }

    if (boardId == null) return;

    const socket = getSocket();
    if (!socket) return;

    if (socket.connected) {
        joinBoard(boardId);
    } else {
        socket.once("connect", () => joinBoard(boardId));
        connectSocket();
    }
}

export function teardownActiveBoard() {
    if (activeBoardId != null) {
        leaveBoard(activeBoardId);
        activeBoardId = null;
    }
}
