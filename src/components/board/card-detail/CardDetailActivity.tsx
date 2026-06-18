"use client";
import { format } from "date-fns";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui";
import CommentComposer from "@/components/board/CommentComposer";
import CommentThread from "@/components/board/CommentThread";
import Avatar from "@/components/ui/Avatar";
import type { Card } from "@/types/card.types";
import type { Comment } from "@/lib/api/commentApi";
import type { CardDetailActions } from "./useCardDetailActions";
import CardDetailEmpty from "./CardDetailEmpty";

interface Props {
    card: Card;
    comments: Comment[];
    readOnly: boolean;
    meId?: number;
    meName?: string;
    meAvatar?: string | null;
    boardMembers: { userId: number; name: string; avatar?: string | null }[];
    accentColor?: string;
    actions: CardDetailActions;
    column?: boolean;
}

export default function CardDetailActivity({
    card,
    comments,
    readOnly,
    meId,
    meName = "You",
    meAvatar,
    boardMembers,
    actions,
    column = false,
}: Props) {
    const {
        commentInput,
        setCommentInput,
        handlePostComment,
        handleCommentTyping,
        postingComment,
        replyToComment,
        setReplyToComment,
        hideActivityDetails,
        setHideActivityDetails,
        typingUsers,
        editingCommentId,
        setEditingCommentId,
        editingCommentText,
        setEditingCommentText,
        handleSaveComment,
        confirmDeleteCommentId,
        setConfirmDeleteCommentId,
        handleDeleteComment,
    } = actions;

    return (
        <div className={column ? "flex flex-col h-full min-h-0" : "border-t border-slate-200 pt-8 mt-8 lg:mt-0 lg:pt-0 lg:border-t-0"}>
            <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-slate-500" />
                    <h3 className="text-sm font-semibold text-[#172b4d]">Comments and activity</h3>
                </div>
                <button
                    type="button"
                    onClick={() => setHideActivityDetails((v) => !v)}
                    className="text-xs text-[#5e6c84] hover:text-[#172b4d] px-2 py-1 rounded hover:bg-slate-100 cursor-pointer transition-colors"
                >
                    {hideActivityDetails ? "Show details" : "Hide details"}
                </button>
            </div>

            {!readOnly && (
                <div className="mb-4 shrink-0">
                    <CommentComposer
                        value={commentInput}
                        onChange={setCommentInput}
                        onSubmit={handlePostComment}
                        onTyping={handleCommentTyping}
                        members={boardMembers}
                        userName={meName}
                        userAvatar={meAvatar}
                        loading={postingComment}
                        replyToName={replyToComment?.name}
                        onCancelReply={() => setReplyToComment(null)}
                    />
                </div>
            )}

            {Object.keys(typingUsers).length > 0 && (
                <p className="text-xs text-slate-500 italic mb-3 shrink-0">
                    {Object.values(typingUsers).join(", ")}{" "}
                    {Object.keys(typingUsers).length === 1 ? "is" : "are"} typing…
                </p>
            )}

            {!hideActivityDetails && (
                <div className={column ? "flex-1 min-h-0 overflow-y-auto space-y-4 pr-1" : "space-y-4"}>
                    <div className="flex items-start gap-2 text-sm">
                        <Avatar
                            src={card.creator?.avatar}
                            name={card.creator?.name ?? "Someone"}
                            size="sm"
                            className="h-7 w-7 text-[10px] shrink-0"
                        />
                        <div>
                            <p className="text-[#172b4d]">
                                <span className="font-medium">{card.creator?.name ?? "Someone"}</span>
                                {" "}added this card
                            </p>
                            <p className="text-xs text-[#5e6c84] mt-0.5">
                                {format(new Date(card.createdAt), "MMM d, yyyy, h:mm a")}
                            </p>
                        </div>
                    </div>

                    {comments.length === 0 && readOnly && (
                        <CardDetailEmpty icon={MessageSquare} message="No comments yet" />
                    )}

                    {comments.map((c) => (
                        <div key={c.id}>
                            {confirmDeleteCommentId === c.id ? (
                                <div className="ml-9 p-3 rounded-lg bg-red-50 border border-red-200 text-sm">
                                    <p className="text-red-700 font-medium mb-2">Delete this comment?</p>
                                    <div className="flex gap-2">
                                        <Button type="button" size="sm" variant="outline" onClick={() => setConfirmDeleteCommentId(null)}>
                                            Cancel
                                        </Button>
                                        <Button type="button" size="sm" variant="danger" onClick={() => handleDeleteComment(c.id)}>
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <CommentThread
                                    comment={c}
                                    currentUserId={meId}
                                    readOnly={readOnly}
                                    editingCommentId={editingCommentId}
                                    editingCommentText={editingCommentText}
                                    onStartEdit={(id, content) => {
                                        setEditingCommentId(id);
                                        setEditingCommentText(content);
                                    }}
                                    onEditTextChange={setEditingCommentText}
                                    onSaveEdit={handleSaveComment}
                                    onCancelEdit={() => {
                                        setEditingCommentId(null);
                                        setEditingCommentText("");
                                    }}
                                    onDelete={setConfirmDeleteCommentId}
                                    onReply={(comment) =>
                                        setReplyToComment({ id: comment.id, name: comment.author.name })
                                    }
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}

            <p className="text-[10px] text-slate-400 mt-4 shrink-0">Card #{card.id}</p>
        </div>
    );
}
