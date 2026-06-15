export const BOARD_COLORS = [
    "#0079BF", "#4BBC4E", "#FF9F1A", "#EB5A46",
    "#C377E0", "#FF78CB", "#00C2E0", "#0052CC",
    "#519839", "#B04632", "#89609E", "#CD5A91",
];

export function getBoardColor(background: string | null | undefined, boardId: number): string {
    if (background) return background;
    return BOARD_COLORS[boardId % BOARD_COLORS.length];
}
