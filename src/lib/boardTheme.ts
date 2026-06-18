import type { CSSProperties } from "react";
import { cn } from "@/utils/cn";

function parseHex(hex: string): { r: number; g: number; b: number } | null {
    const raw = hex.trim().replace("#", "");
    if (raw.length === 3) {
        return {
            r: parseInt(raw[0] + raw[0], 16),
            g: parseInt(raw[1] + raw[1], 16),
            b: parseInt(raw[2] + raw[2], 16),
        };
    }
    if (raw.length === 6) {
        return {
            r: parseInt(raw.slice(0, 2), 16),
            g: parseInt(raw.slice(2, 4), 16),
            b: parseInt(raw.slice(4, 6), 16),
        };
    }
    return null;
}

function relativeLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map((c) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/** Mix board color with white (0–1 ratio of board color). */
export function mixWithWhite(boardColor: string, ratio: number): string {
    const rgb = parseHex(boardColor);
    if (!rgb) return "#ffffff";
    const r = Math.round(rgb.r * ratio + 255 * (1 - ratio));
    const g = Math.round(rgb.g * ratio + 255 * (1 - ratio));
    const b = Math.round(rgb.b * ratio + 255 * (1 - ratio));
    return `rgb(${r}, ${g}, ${b})`;
}

/** Darken a hex color by a factor (0–1). */
export function darkenColor(boardColor: string, factor: number): string {
    const rgb = parseHex(boardColor);
    if (!rgb) return boardColor;
    const f = 1 - factor;
    return `rgb(${Math.round(rgb.r * f)}, ${Math.round(rgb.g * f)}, ${Math.round(rgb.b * f)})`;
}

export const BOARD_SCROLLBAR_CLASS = "board-scrollbar";
export const BOARD_SCROLLBAR_X_CLASS = "board-scrollbar-x";
export const BOARD_SCROLLBAR_Y_CLASS = "board-scrollbar-y";

export interface BoardTheme {
    boardColor: string;
    /** True when board bg is very dark (rare); cards stay white regardless. */
    isDarkCanvas: boolean;
    listColumn: string;
    listHeader: string;
    listMenuBtn: string;
    listAddBtn: string;
    listCount: string;
    card: string;
    cardTitle: string;
    cardMeta: string;
    cardMetaMuted: string;
    cardDueDefault: string;
    cardAssigneeRing: string;
    addListColumn: string;
    addListBtn: string;
    dropZone: string;
    /** Modal theming */
    modalSurface: string;
    modalSidebar: string;
    modalText: string;
    modalMuted: string;
    modalBorder: string;
    modalInput: string;
    modalPill: string;
    modalCoverBand: string;
    modalActionPill: string;
    modalAccentStyle: { borderTopColor: string; borderTopWidth: string };
}

/** Board-themed scrollbar CSS variables (7px, matches board color). */
export function getBoardScrollbarStyle(boardColor: string): CSSProperties {
    const rgb = parseHex(boardColor);
    const lum = rgb ? relativeLuminance(rgb.r, rgb.g, rgb.b) : 0.4;
    const isLight = lum > 0.55;

    const thumb = isLight ? darkenColor(boardColor, 0.28) : "rgba(255, 255, 255, 0.62)";
    const thumbHover = isLight ? darkenColor(boardColor, 0.42) : "rgba(255, 255, 255, 0.82)";
    const track = isLight ? "rgba(0, 0, 0, 0.14)" : "rgba(255, 255, 255, 0.22)";

    return {
        "--board-scrollbar-thumb": thumb,
        "--board-scrollbar-thumb-hover": thumbHover,
        "--board-scrollbar-track": track,
    } as CSSProperties;
}

export function getBoardTheme(boardColor: string): BoardTheme {
    const rgb = parseHex(boardColor);
    const lum = rgb ? relativeLuminance(rgb.r, rgb.g, rgb.b) : 0.4;
    const isDarkCanvas = lum < 0.12;

    const modalTint = mixWithWhite(boardColor, 0.06);
    const modalSidebar = mixWithWhite(boardColor, 0.04);

    return {
        boardColor,
        isDarkCanvas,
        // Trello classic: light gray lists + white cards on every board color
        listColumn: "bg-[#ebecf0] shadow-md",
        listHeader: "text-[#172b4d]",
        listMenuBtn: "text-slate-500 hover:text-slate-700 hover:bg-black/5",
        listAddBtn: "text-slate-600 hover:text-slate-800 hover:bg-black/5",
        listCount: "text-slate-500",
        card: "bg-white ring-1 ring-black/[0.08] hover:ring-black/15 shadow-sm hover:shadow-md",
        cardTitle: "text-[#172b4d]",
        cardMeta: "text-slate-600",
        cardMetaMuted: "text-slate-500",
        cardDueDefault: "bg-slate-100 text-slate-600",
        cardAssigneeRing: "ring-white",
        addListColumn: "bg-white/25 backdrop-blur-sm",
        addListBtn: "bg-white/25 hover:bg-white/40 text-white",
        dropZone: "border-slate-400/50 text-slate-500",
        modalSurface: "#ffffff",
        modalSidebar: modalSidebar,
        modalText: "#172b4d",
        modalMuted: "#5e6c84",
        modalBorder: mixWithWhite(boardColor, 0.15),
        modalInput: "#ffffff",
        modalPill: mixWithWhite(boardColor, 0.1),
        modalCoverBand: mixWithWhite(boardColor, 0.18),
        modalActionPill: mixWithWhite(boardColor, 0.08),
        modalAccentStyle: {
            borderTopColor: boardColor,
            borderTopWidth: "4px",
        },
    };
}

export function boardThemeClass(theme: BoardTheme, key: keyof BoardTheme): string {
    const value = theme[key];
    return typeof value === "string" ? value : "";
}

export function cnTheme(theme: BoardTheme, ...keys: (keyof BoardTheme)[]): string {
    return cn(...keys.map((k) => boardThemeClass(theme, k)));
}
