import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateComment, usePinComment, useUnpinComment, useLikeComment, useUnlikeComment } from '../../hooks/useComments';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import { formatDate } from '../../utils/formatDate';
import useAuthStore from '../../store/authStore';

const CommentThread = ({ postId, comment, level = 0, postAuthorId }) => {
    const [showReplies, setShowReplies] = useState(false);
    const [isReplying, setIsReplying] = useState(false);
    const [replyMediaFile, setReplyMediaFile] = useState(null);
    const [optimisticLike, setOptimisticLike] = useState(null);
    const replyFileInputRef = useRef(null);
    const user = useAuthStore((state) => state.user);
    const queryClient = useQueryClient();
    const { register, handleSubmit, reset } = useForm();
    const createCommentMutation = useCreateComment();
    const pinMutation = usePinComment();
    const unpinMutation = useUnpinComment();
    const likeCommentMutation = useLikeComment();
    const unlikeCommentMutation = useUnlikeComment();
    const isPostAuthor = user && postAuthorId && user.id === postAuthorId;
    const isCommentAuthor = comment.user?.id === postAuthorId;
    const isTopLevel = level === 0;
    const isPinned = !!(comment.is_pinned || comment.pinned_at);
    const isLiked = optimisticLike !== null ? optimisticLike.is_liked : (comment.is_liked ?? false);
    const likesCount = optimisticLike !== null ? optimisticLike.likes_count : (comment.likes_count ?? 0);

    useEffect(() => {
        setOptimisticLike(null);
    }, [comment.id, comment.is_liked, comment.likes_count]);

    // Use embedded replies from API (backend returns top-level comments with nested replies)
    const replies = (comment.replies && Array.isArray(comment.replies) ? comment.replies : [])
        .slice()
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    const onSubmit = (data) => {
        const hasContent = data.content?.trim();
        const hasMedia = !!replyMediaFile;
        if (!hasContent && !hasMedia) return;

        let payload;
        if (hasMedia) {
            payload = new FormData();
            payload.append('content', hasContent ? data.content.trim() : '');
            payload.append('parent_comment_id', String(comment.id));
            payload.append('media', replyMediaFile);
        } else {
            payload = { content: data.content.trim(), parent_comment_id: comment.id };
        }

        createCommentMutation.mutate(
            { postId, data: payload },
            {
                onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ['comments', postId] });
                    queryClient.refetchQueries({ queryKey: ['comments', postId] });
                    reset();
                    setReplyMediaFile(null);
                    if (replyFileInputRef.current) replyFileInputRef.current.value = '';
                    setIsReplying(false);
                    setShowReplies(true);
                },
            }
        );
    };

    return (
        <div className={`${level > 0 ? 'ml-8 mt-3' : ''}`}>
            <div className="flex items-start space-x-3">
                <Avatar src={comment.user?.profile_picture} alt={comment.user?.name} size="sm" />
                <div className="flex-1">
                    <div className="bg-[var(--theme-surface-hover)] rounded-lg p-3">
                        <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mb-1">
                            <span className="font-semibold text-sm text-[var(--text-primary)]">
                                {comment.user?.name}
                            </span>
                            {isCommentAuthor && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--theme-accent)]/15 text-[var(--theme-accent)]">
                                    Author
                                </span>
                            )}
                            {isTopLevel && isPinned && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                    <span className="material-symbols-outlined text-xs">push_pin</span>
                                    Pinned
                                </span>
                            )}
                            <span className="text-xs text-[var(--text-secondary)]">
                                {formatDate(comment.created_at)}
                            </span>
                        </div>
                        {comment.content ? <p className="text-sm text-[var(--text-primary)]">{comment.content}</p> : null}
                        {comment.media_url && (
                            <div className="mt-2 rounded-lg overflow-hidden bg-[var(--theme-surface)] max-w-full">
                                {comment.media_type === 'video' ? (
                                    <video src={comment.media_url} controls className="max-h-48 w-full object-contain" />
                                ) : (
                                    <img src={comment.media_url} alt="" className="max-h-48 max-w-full object-contain" />
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2 ml-2">
                        {user && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (isLiked) {
                                        setOptimisticLike({ is_liked: false, likes_count: Math.max(0, likesCount - 1) });
                                        unlikeCommentMutation.mutate(
                                            { commentId: comment.id, postId },
                                            { onSettled: () => queryClient.invalidateQueries({ queryKey: ['comments', postId] }) }
                                        );
                                    } else {
                                        setOptimisticLike({ is_liked: true, likes_count: likesCount + 1 });
                                        likeCommentMutation.mutate(
                                            { commentId: comment.id, postId },
                                            { onSettled: () => queryClient.invalidateQueries({ queryKey: ['comments', postId] }) }
                                        );
                                    }
                                }}
                                disabled={likeCommentMutation.isPending || unlikeCommentMutation.isPending}
                                className={`text-xs font-medium inline-flex items-center gap-1 ${isLiked ? 'text-rose-500' : 'text-[var(--text-secondary)] hover:text-rose-500'}`}
                                title={isLiked ? 'Unlike' : 'Like'}
                            >
                                <span
                                    className={`material-symbols-outlined text-sm ${isLiked ? 'text-rose-500' : ''}`}
                                    style={isLiked ? { fontVariationSettings: "'FILL' 1" } : undefined}
                                >favorite</span>
                                {likesCount > 0 && <span>{likesCount}</span>}
                            </button>
                        )}
                        <button
                            onClick={() => setIsReplying(!isReplying)}
                            className="text-xs text-[var(--text-secondary)] hover:text-[var(--theme-accent)]"
                        >
                            Reply
                        </button>
                        {isTopLevel && isPostAuthor && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (isPinned) {
                                        unpinMutation.mutate({ commentId: comment.id, postId });
                                    } else {
                                        pinMutation.mutate({ commentId: comment.id, postId });
                                    }
                                }}
                                disabled={pinMutation.isPending || unpinMutation.isPending}
                                className={`text-xs font-medium inline-flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors disabled:opacity-60 ${
                                    isPinned
                                        ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                                        : 'text-[var(--text-secondary)] hover:text-[var(--theme-accent)] hover:bg-[var(--theme-accent)]/10'
                                }`}
                                title={isPinned ? 'Unpin this comment' : 'Pin this comment to the top'}
                            >
                                <span className={`material-symbols-outlined text-sm ${isPinned ? 'fill-amber-600 dark:fill-amber-400' : ''}`}>push_pin</span>
                                {isPinned ? 'Unpin' : 'Pin'}
                            </button>
                        )}
                        {(comment.replies_count > 0 || replies.length > 0) && (
                            <button
                                onClick={() => setShowReplies(!showReplies)}
                                className="text-xs text-[var(--text-secondary)] hover:text-[var(--theme-accent)]"
                            >
                                {showReplies ? 'Hide' : 'Show'} {Math.max(comment.replies_count ?? 0, replies.length)} replies
                            </button>
                        )}
                    </div>

                    {isReplying && (
                        <form onSubmit={handleSubmit(onSubmit)} className="mt-3">
                            <div className="flex items-start space-x-2">
                                <Avatar src={user?.profile_picture} alt={user?.name} size="sm" />
                                <div className="flex-1">
                                    <input ref={replyFileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => setReplyMediaFile(e.target.files?.[0] || null)} />
                                    <textarea
                                        {...register('content')}
                                        placeholder="Write a reply..."
                                        rows={2}
                                        className="w-full px-3 py-2 border border-[var(--theme-border)] rounded-lg bg-[var(--theme-surface-hover)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/40 focus:border-[var(--theme-accent)] text-sm resize-none"
                                    />
                                    <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                                        <button type="button" onClick={() => replyFileInputRef.current?.click()} className="text-xs text-gray-500 hover:text-[#359EFF] flex items-center gap-1">
                                            <span className="material-symbols-outlined text-base">videocam</span>
                                            {replyMediaFile ? replyMediaFile.name : 'Photo/Video'}
                                        </button>
                                        <div className="flex items-center gap-2">
                                            <Button type="button" variant="ghost" size="sm" onClick={() => setIsReplying(false)}>Cancel</Button>
                                            <Button type="submit" size="sm" disabled={createCommentMutation.isPending} loading={createCommentMutation.isPending}>Reply</Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    )}

                    {showReplies && replies.length > 0 && (
                        <div className="mt-3">
                            {replies.map((reply) => (
                                <CommentThread
                                    key={reply.id}
                                    postId={postId}
                                    comment={reply}
                                    level={level + 1}
                                    postAuthorId={postAuthorId}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CommentThread;
