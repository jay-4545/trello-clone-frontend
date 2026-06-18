"use client";
import { format } from "date-fns";
import type { Comment } from "@/lib/api/commentApi";
import { renderCommentContent } from "@/lib/utils/parseMentions";
import Avatar from "@/components/ui/Avatar";

interface Props {
    comment: Comment;
    currentUserId?: number;
    readOnly: boolean;
    editingCommentId: number | null;
    editingCommentText: string;
    onStartEdit: (id: number, content: string) => void;
    onEditTextChange: (text: string) => void;
    onSaveEdit: () => void;
    onCancelEdit: () => void;
    onDelete: (id: number) => void;
    onReply: (comment: Comment) => void;
    isReply?: boolean;
}

export default function CommentThread({
    comment,
    currentUserId,
    readOnly,
    editingCommentId,
    editingCommentText,
    onStartEdit,
    onEditTextChange,
    onSaveEdit,
    onCancelEdit,
    onDelete,
    onReply,
    isReply = false,
}: Props) {
    const isMine = currentUserId === comment.userId;

    return (
        <div className={isReply ? "mt-3" : undefined}>
            <div className="flex items-start gap-2 group">
                <Avatar
                    src={comment.author.avatar}
                    name={comment.author.name}
                    size="sm"
                    className="h-7 w-7 text-[10px] shrink-0"
                />
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800">
                        <span className="font-medium">{comment.author.name}</span>
                        {comment.isDeleted ? " deleted a comment" : ""}
                    </p>
                    {!comment.isDeleted && (
                        <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap break-words">
                            {editingCommentId === comment.id ? (
                                <textarea
                                    autoFocus
                                    value={editingCommentText}
                                    onChange={(e) => onEditTextChange(e.target.value)}
                                    rows={3}
                                    className="w-full text-sm text-slate-800 bg-white border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                            ) : (
                                renderCommentContent(comment.content)
                            )}
                        </p>
                    )}
                    <p className="text-xs text-blue-400 mt-1">
                        {format(new Date(comment.createdAt), "MMM d, yyyy, h:mm a")}
                        {comment.isEdited && " (edited)"}
                    </p>
                    {isMine && !comment.isDeleted && editingCommentId !== comment.id && (
                        <div className="flex items-center gap-2 mt-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                            <button
                                onClick={() => onStartEdit(comment.id, comment.content)}
                                className="text-[10px] text-slate-500 hover:underline cursor-pointer"
                            >
                                Edit
                            </button>
                            <button
                                type="button"
                                onClick={() => onDelete(comment.id)}
                                className="text-[10px] text-red-400 hover:underline cursor-pointer"
                            >
                                Delete
                            </button>
                        </div>
                    )}
                    {!readOnly && !comment.isDeleted && !isReply && (
                        <button
                            type="button"
                            onClick={() => onReply(comment)}
                            className="text-[10px] text-slate-500 hover:underline mt-1 cursor-pointer opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                        >
                            Reply
                        </button>
                    )}
                    {editingCommentId === comment.id && (
                        <div className="flex gap-2 mt-2">
                            <button onClick={onSaveEdit} className="text-xs text-blue-400 hover:underline cursor-pointer">Save</button>
                            <button onClick={onCancelEdit} className="text-xs text-slate-500 hover:underline cursor-pointer">Cancel</button>
                        </div>
                    )}
                </div>
            </div>

            {comment.replies && comment.replies.length > 0 && (
                <div className="ml-9 mt-2 space-y-3 border-l-2 border-slate-100 pl-3">
                    {comment.replies.map((reply) => (
                        <CommentThread
                            key={reply.id}
                            comment={reply}
                            currentUserId={currentUserId}
                            readOnly={readOnly}
                            editingCommentId={editingCommentId}
                            editingCommentText={editingCommentText}
                            onStartEdit={onStartEdit}
                            onEditTextChange={onEditTextChange}
                            onSaveEdit={onSaveEdit}
                            onCancelEdit={onCancelEdit}
                            onDelete={onDelete}
                            onReply={onReply}
                            isReply
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
