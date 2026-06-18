"use client";
import { useState, useEffect, useMemo } from "react";
import { connectSocket } from "./socketClient";

interface MemberUser {
    id: number;
    name: string;
    avatar: string | null;
}

interface BoardMember {
    userId: number;
    user: MemberUser;
}

/** Track users currently viewing a board via socket presence events. */
export function useBoardPresence(
    boardId: number | null | undefined,
    members: BoardMember[],
    currentUserId?: number
) {
    const [viewingUserIds, setViewingUserIds] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (!boardId || Number.isNaN(boardId)) return;

        const socket = connectSocket();
        if (!socket) return;

        const onViewing = ({ userId, boardId: bid }: { userId: number; boardId: number }) => {
            if (bid !== boardId || userId === currentUserId) return;
            setViewingUserIds((prev) => new Set(prev).add(userId));
        };

        const onOffline = ({ userId, boardId: bid }: { userId: number; boardId: number }) => {
            if (bid !== boardId) return;
            setViewingUserIds((prev) => {
                const next = new Set(prev);
                next.delete(userId);
                return next;
            });
        };

        socket.on("presence:viewing", onViewing);
        socket.on("presence:offline", onOffline);

        return () => {
            socket.off("presence:viewing", onViewing);
            socket.off("presence:offline", onOffline);
            setViewingUserIds(new Set());
        };
    }, [boardId, currentUserId]);

    const viewingUsers = useMemo(
        () =>
            Array.from(viewingUserIds)
                .map((id) => members.find((m) => m.userId === id)?.user)
                .filter((u): u is MemberUser => !!u),
        [viewingUserIds, members]
    );

    return { viewingUsers, viewingCount: viewingUsers.length };
}
