import React, { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { createPortal } from 'react-dom';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import CommentThread from '../posts/CommentThread';
import { useComments, useCreateComment } from '../../hooks/useComments';
import useAuthStore from '../../store/authStore';

/**
 * Modal that shows comments for a post and allows adding new comments.
 * Used when the comment button is clicked on a post card.
 */
const CommentModal = ({ post, onClose }) => {
    const user = useAuthStore((state) => state.user);
    const { data: commentsData = [], isLoading: commentsLoading } = useComments(post?.id);
    const createCommentMutation = useCreateComment();

    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow || '';
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [onClose]);

    if (!post) return null;

    const topLevelComments = (Array.isArray(commentsData) ? commentsData : []).filter(
        (c) => !c.parent_comment_id
    );
    const count = Math.max(post.comments_count ?? 0, topLevelComments.length);

    const modalContent = (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Comments"
        >
            <div
                className="w-full max-w-lg rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] shadow-xl overflow-hidden flex flex-col max-h-[85vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-[var(--theme-border)] shrink-0">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                        Comments {count > 0 && `(${count})`}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-[var(--theme-surface-hover)] text-[var(--text-secondary)]"
                        aria-label="Close"
                    >
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                {/* Optional: compact post context */}
                <div className="px-4 py-2 border-b border-[var(--theme-border)] bg-[var(--theme-surface-hover)]/50 shrink-0">
                    <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
                        {post.content?.trim() ? (
                            post.shared_post ? (
                                <>Shared: {post.shared_post.content?.slice(0, 80)}…</>
                            ) : (
                                post.content
                            )
                        ) : (
                            <>Post by @{post.user?.username ?? 'user'}</>
                        )}
                    </p>
                </div>

                {/* Comments list */}
                <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
                    {commentsLoading ? (
                        <div className="flex justify-center py-8">
                            <LoadingSpinner size="sm" />
                        </div>
                    ) : topLevelComments.length === 0 ? (
                        <p className="text-sm text-[var(--text-secondary)] text-center py-6">
                            No comments yet. Be the first to comment.
                        </p>
                    ) : (
                        topLevelComments.map((comment) => (
                            <CommentThread key={comment.id} postId={post.id} comment={comment} postAuthorId={post.user?.id} />
                        ))
                    )}
                </div>

                {/* Add comment */}
                {user && (
                    <div className="p-4 border-t border-[var(--theme-border)] shrink-0 bg-[var(--theme-surface)]">
                        <AddCommentForm
                            onSubmit={(data) =>
                                createCommentMutation.mutate(
                                    { postId: post.id, data },
                                    { onSuccess: () => {} }
                                )
                            }
                            isPending={createCommentMutation.isPending}
                        />
                    </div>
                )}
            </div>
        </div>
    );

    return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};

function AddCommentForm({ onSubmit, isPending }) {
    const { register, handleSubmit, reset } = useForm();
    const user = useAuthStore((state) => state.user);
    const [mediaFile, setMediaFile] = useState(null);
    const fileInputRef = useRef(null);

    return (
        <form
            onSubmit={handleSubmit((data) => {
                const content = data.content?.trim();
                const hasMedia = !!mediaFile;
                if (!content && !hasMedia) return;
                if (hasMedia) {
                    const formData = new FormData();
                    formData.append('content', content || '');
                    formData.append('media', mediaFile);
                    onSubmit(formData);
                    setMediaFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                } else {
                    onSubmit({ content });
                }
                reset();
            })}
            className="flex items-start gap-3"
        >
            <Avatar src={user?.profile_picture} alt={user?.name} size="sm" className="w-8 h-8 shrink-0" />
            <div className="flex-1 min-w-0">
                <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => setMediaFile(e.target.files?.[0] || null)} />
                <textarea
                    {...register('content')}
                    placeholder="Write a comment..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-hover)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:ring-2 focus:ring-[var(--theme-accent)]/40 focus:border-[var(--theme-accent)] outline-none resize-none text-sm"
                />
                <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs text-[var(--text-secondary)] hover:text-[var(--theme-accent)] flex items-center gap-1">
                        <span className="material-symbols-outlined text-base">videocam</span>
                        {mediaFile ? mediaFile.name : 'Photo/Video'}
                    </button>
                    <Button type="submit" size="sm" disabled={isPending} loading={isPending} className="!px-3 !py-1.5 text-xs">
                        Comment
                    </Button>
                </div>
            </div>
        </form>
    );
}

export default CommentModal;
