"use client";
import type { Card } from "@/types/card.types";
import type { BoardTheme } from "@/lib/boardTheme";

interface Props {
    card: Card;
    theme: BoardTheme;
}

export default function CardDetailCover({ card, theme }: Props) {
    if (card.coverImage) {
        return (
            <div className="relative group shrink-0">
                <div
                    className="h-36 sm:h-44 bg-cover bg-center"
                    style={{ backgroundImage: `url(${card.coverImage})` }}
                />
                <div
                    className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/30 to-transparent pointer-events-none"
                    aria-hidden
                />
            </div>
        );
    }

    return (
        <div
            className="h-24 sm:h-28 shrink-0"
            style={{ backgroundColor: theme.modalCoverBand }}
            aria-hidden
        />
    );
}
