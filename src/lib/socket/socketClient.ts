import { io, Socket } from "socket.io-client";
import { token } from "@/utils/token";

let socket: Socket | null = null;

export function getSocket(): Socket {
    if (!socket) {
        socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
            auth: { token: token.getAccess() },
            transports: ["websocket", "polling"],
            autoConnect: false,
        });
    }
    return socket;
}

export function connectSocket() {
    const s = getSocket();
    if (!s.connected) s.connect();
    return s;
}

export function disconnectSocket() {
    socket?.disconnect();
    socket = null;
}

export function joinBoard(boardId: number) {
    getSocket().emit("board:join", { boardId });
}

export function leaveBoard(boardId: number) {
    getSocket().emit("board:leave", { boardId });
}