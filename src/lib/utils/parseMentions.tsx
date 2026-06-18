import type { ReactNode } from "react";

const MENTION_REGEX = /@\[([^\]]+)\]\((\d+)\)/g;

/** Split comment text into plain segments and mention tokens. */
export function parseMentionSegments(content: string): { type: "text" | "mention"; value: string; userId?: number }[] {
    const segments: { type: "text" | "mention"; value: string; userId?: number }[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    const regex = new RegExp(MENTION_REGEX.source, "g");
    while ((match = regex.exec(content)) !== null) {
        if (match.index > lastIndex) {
            segments.push({ type: "text", value: content.slice(lastIndex, match.index) });
        }
        segments.push({ type: "mention", value: match[1], userId: Number(match[2]) });
        lastIndex = regex.lastIndex;
    }
    if (lastIndex < content.length) {
        segments.push({ type: "text", value: content.slice(lastIndex) });
    }
    return segments;
}

/** Render comment content with @mentions as styled chips. */
export function renderCommentContent(content: string): ReactNode {
    const segments = parseMentionSegments(content);
    if (segments.length === 0) return content;

    return segments.map((seg, i) =>
        seg.type === "mention" ? (
            <span
                key={`${seg.userId}-${i}`}
                className="text-blue-600 font-medium bg-blue-50 rounded px-0.5"
            >
                @{seg.value}
            </span>
        ) : (
            <span key={i}>{seg.value}</span>
        )
    );
}

/** Insert a mention token at the given position in a textarea value. */
export function insertMention(
    value: string,
    cursorPos: number,
    mentionStart: number,
    userName: string,
    userId: number
): { newValue: string; newCursor: number } {
    const before = value.slice(0, mentionStart);
    const after = value.slice(cursorPos);
    const token = `@[${userName}](${userId}) `;
    const newValue = before + token + after;
    const newCursor = before.length + token.length;
    return { newValue, newCursor };
}

/** Detect if user is typing a mention query at cursor position. */
export function getActiveMentionQuery(
    value: string,
    cursorPos: number
): { start: number; query: string } | null {
    const before = value.slice(0, cursorPos);
    const atIndex = before.lastIndexOf("@");
    if (atIndex === -1) return null;

    const between = before.slice(atIndex + 1);
    if (between.includes(" ") || between.includes("\n")) return null;
    if (atIndex > 0 && !/\s/.test(value[atIndex - 1])) return null;

    return { start: atIndex, query: between };
}
