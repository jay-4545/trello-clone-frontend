import { io, Socket } from "socket.io-client";
import { token } from "@/utils/token";

let socket: Socket | null = null;

function syncSocketAuth(s: Socket) {
    s.auth = { token: token.getAccess() };
}

export function getSocket(): Socket | null {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (!url) return null;

    if (!socket) {
        socket = io(url, {
            auth: { token: token.getAccess() },
            transports: ["websocket", "polling"],
            autoConnect: false,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
        });

        socket.io.on("reconnect_attempt", () => {
            syncSocketAuth(socket!);
        });
    }
    return socket;
}

export function connectSocket(): Socket | null {
    const s = getSocket();
    if (!s) return null;
    syncSocketAuth(s);
    if (!s.connected) s.connect();
    return s;
}

export function disconnectSocket() {
    socket?.disconnect();
    socket = null;
}

export function joinBoard(boardId: number) {
    getSocket()?.emit("board:join", { boardId });
}

export function leaveBoard(boardId: number) {
    getSocket()?.emit("board:leave", { boardId });
}