"use client";
import { useState } from "react";
import { Archive, X, RotateCcw, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import Button from "@/components/ui/Button";
import {
    useGetArchivedCardsQuery,
    useRestoreCardMutation,
    useDeleteCardMutation,
} from "@/lib/api/cardApi";
import {
    useGetArchivedListsQuery,
    useRestoreListMutation,
    useDeleteListMutation,
} from "@/lib/api/listApi";
import { parseApiError } from "@/utils/errorParser";
import { cn } from "@/utils/cn";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

type PendingDelete =
    | { type: "card"; cardId: number; listId: number; title: string }
    | { type: "list"; listId: number; name: string };

interface Props {
    workspaceId: number;
    boardId: number;
    open: boolean;
    onClose: () => void;
    canRestore?: boolean;
    canDelete?: boolean;
}

export default function ArchivedItemsPanel({
    workspaceId,
    boardId,
    open,
    onClose,
    canRestore = true,
    canDelete = true,
}: Props) {
    const [tab, setTab] = useState<"cards" | "lists">("cards");
    const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
    const [deletingCardId, setDeletingCardId] = useState<number | null>(null);
    const [deletingListId, setDeletingListId] = useState<number | null>(null);

    const { data: cardsData, isLoading: loadingCards } = useGetArchivedCardsQuery(
        { workspaceId, boardId },
        { skip: !open }
    );
    const { data: listsData, isLoading: loadingLists } = useGetArchivedListsQuery(
        { workspaceId, boardId },
        { skip: !open }
    );
    const [restoreCard, { isLoading: restoringCard }] = useRestoreCardMutation();
    const [restoreList, { isLoading: restoringList }] = useRestoreListMutation();
    const [deleteCard] = useDeleteCardMutation();
    const [deleteList] = useDeleteListMutation();

    const archivedCards = cardsData?.data ?? [];
    const archivedLists = listsData?.data ?? [];

    const handleRestoreCard = async (cardId: number, listId: number) => {
        try {
            await restoreCard({ workspaceId, boardId, listId, cardId }).unwrap();
            toast.success("Card restored");
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handleRestoreList = async (listId: number) => {
        try {
            await restoreList({ workspaceId, boardId, listId }).unwrap();
            toast.success("List restored");
        } catch (err) {
            toast.error(parseApiError(err));
        }
    };

    const handleDeleteCard = async () => {
        if (!pendingDelete || pendingDelete.type !== "card") return;
        const { cardId, listId } = pendingDelete;
        setDeletingCardId(cardId);
        try {
            await deleteCard({ workspaceId, boardId, listId, cardId }).unwrap();
            toast.success("Card deleted");
            setPendingDelete(null);
        } catch (err) {
            toast.error(parseApiError(err));
        } finally {
            setDeletingCardId(null);
        }
    };

    const handleDeleteList = async () => {
        if (!pendingDelete || pendingDelete.type !== "list") return;
        const { listId } = pendingDelete;
        setDeletingListId(listId);
        try {
            await deleteList({ workspaceId, boardId, listId }).unwrap();
            toast.success("List deleted");
            setPendingDelete(null);
        } catch (err) {
            toast.error(parseApiError(err));
        } finally {
            setDeletingListId(null);
        }
    };

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
            <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                        <Archive className="h-5 w-5 text-slate-600" />
                        <h2 className="text-lg font-semibold text-slate-900">Archived items</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex border-b border-slate-200">
                    {(["cards", "lists"] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={cn(
                                "flex-1 py-2.5 text-sm font-medium capitalize transition-colors",
                                tab === t
                                    ? "text-blue-600 border-b-2 border-blue-600"
                                    : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            {t} ({t === "cards" ? archivedCards.length : archivedLists.length})
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {tab === "cards" && (
                        loadingCards ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
                            </div>
                        ) : archivedCards.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-12">No archived cards</p>
                        ) : (
                            archivedCards.map((card) => (
                                <div
                                    key={card.id}
                                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50"
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-slate-900 truncate">{card.title}</p>
                                        <p className="text-xs text-slate-500">List #{card.listId}</p>
                                    </div>
                                    {(canRestore || canDelete) ? (
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {canRestore && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    loading={restoringCard}
                                                    onClick={() => handleRestoreCard(card.id, card.listId)}
                                                    leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                                                >
                                                    Restore
                                                </Button>
                                            )}
                                            {canDelete && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    loading={deletingCardId === card.id}
                                                    onClick={() =>
                                                        setPendingDelete({
                                                            type: "card",
                                                            cardId: card.id,
                                                            listId: card.listId,
                                                            title: card.title,
                                                        })
                                                    }
                                                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                                    leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                                                >
                                                    Delete
                                                </Button>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-slate-400 shrink-0">View only</span>
                                    )}
                                </div>
                            ))
                        )
                    )}

                    {tab === "lists" && (
                        loadingLists ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
                            </div>
                        ) : archivedLists.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-12">No archived lists</p>
                        ) : (
                            archivedLists.map((list) => (
                                <div
                                    key={list.id}
                                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50"
                                >
                                    <p className="text-sm font-medium text-slate-900 min-w-0 truncate">{list.name}</p>
                                    {(canRestore || canDelete) ? (
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {canRestore && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    loading={restoringList}
                                                    onClick={() => handleRestoreList(list.id)}
                                                    leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                                                >
                                                    Restore
                                                </Button>
                                            )}
                                            {canDelete && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    loading={deletingListId === list.id}
                                                    onClick={() =>
                                                        setPendingDelete({
                                                            type: "list",
                                                            listId: list.id,
                                                            name: list.name,
                                                        })
                                                    }
                                                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                                    leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                                                >
                                                    Delete
                                                </Button>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-slate-400 shrink-0">View only</span>
                                    )}
                                </div>
                            ))
                        )
                    )}
                </div>
            </div>

            <ConfirmDialog
                open={pendingDelete?.type === "card"}
                onClose={() => setPendingDelete(null)}
                onConfirm={handleDeleteCard}
                loading={deletingCardId !== null}
                title={`Delete "${pendingDelete?.type === "card" ? pendingDelete.title : ""}"?`}
                description="This card will be permanently deleted. This action cannot be undone."
                confirmLabel="Delete"
                variant="danger"
            />

            <ConfirmDialog
                open={pendingDelete?.type === "list"}
                onClose={() => setPendingDelete(null)}
                onConfirm={handleDeleteList}
                loading={deletingListId !== null}
                title={`Delete "${pendingDelete?.type === "list" ? pendingDelete.name : ""}"?`}
                description="This list and its archived cards will be permanently deleted. This action cannot be undone."
                confirmLabel="Delete"
                variant="danger"
            />
        </>
    );
}
