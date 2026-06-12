export const BOARD_SOCKET_EVENTS = [
    "card:created",
    "card:updated",
    "card:moved",
    "card:deleted",
    "card:assigned",
    "list:created",
    "list:updated",
    "list:deleted",
    "list:reordered",
    "comment:created",
    "comment:updated",
    "comment:deleted",
    "board:updated",
    "board:member_joined",
    "board:member_left",
] as const;

export const NOTIFICATION_SOCKET_EVENT = "notification:new";
