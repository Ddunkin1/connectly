import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import CommentThread from '../posts/CommentThread';
import { useComments, useCreateComment } from '../../hooks/useComments';
import { useLikePost, useUnlikePost } from '../../hooks/usePosts';
import useAuthStore from '../../store/authStore';
import { formatDate } from '../../utils/formatDate';

/**
 * Modal: left = media (image/video), right = caption, likes, comments.
 * Used when clicking a photo in the profile Media tab.
 */
const MediaView = ({ isOpen, onClose, post }) => {
    const user = useAuthStore((state) => state.user);
    const [optimisticLike, setOptimisticLike] = useState(null); // { is_liked, likes_count }

    const { data: commentsData = [], isLoading: commentsLoading } = useComments(post?.id);
    const createCommentMutation = useCreateComment();
    const likeMutation = useLikePost();
    const unlikeMutation = useUnlikePost();

    const isLiked = optimisticLike !== null ? optimisticLike.is_liked : (post?.is_liked ?? false);
    const likesCount = optimisticLike !== null ? optimisticLike.likes_count : (post?.likes_count ?? 0);
    const recentLikers = post?.recent_likers ?? [];

    useEffect(() => {
        if (!isOpen) return;
        setOptimisticLike(null);
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
    }, [isOpen, onClose]);

    useEffect(() => {
        if (!post) setOptimisticLike(null);
    }, [post?.id]);

    if (typeof document === 'undefined' || !isOpen) return null;
    if (!post?.media_url) return null;

    const handleLike = () => {
        if (isLiked) {
            setOptimisticLike({ is_liked: false, likes_count: Math.max(0, likesCount - 1) });
            unlikeMutation.mutate(post.id);
        } else {
            setOptimisticLike({ is_liked: true, likes_count: likesCount + 1 });
            likeMutation.mutate(post.id);
        }
    };

    const topLevelComments = (Array.isArray(commentsData) ? commentsData : []).filter(
        (c) => !c.parent_comment_id
    );

    const modalContent = (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="View media"
            onClick={onClose}
        >
            <div
                className="relative rounded-2xl border-2 border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute -top-2 -right-2 z-20 p-2 rounded-full bg-[var(--theme-surface)] border-2 border-[var(--theme-border)] text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] transition-colors shadow-lg"
                    aria-label="Close"
                >
                    <span className="material-symbols-outlined text-2xl">close</span>
                </button>

                <div className="flex items-start gap-4 w-full max-w-5xl min-w-[640px] max-h-[85vh]">
                    {/* Left panel: Media only – wraps media so no gray bars above/below */}
                    <div className="relative flex-1 min-w-0 rounded-xl border border-[var(--theme-border)] overflow-hidden flex shrink-0">
                        {post.media_type === 'image' ? (
                        <img
                            src={post.media_url}
                            alt={post.content?.slice(0, 100) || 'Post image'}
                            className="block max-w-full max-h-[85vh] w-auto h-auto object-contain"
                        />
                    ) : (
                        <video
                            src={post.media_url}
                            controls
                            className="block max-w-full max-h-[85vh] w-auto rounded-lg"
                        >
                            Your browser does not support the video tag.
                        </video>
                    )}
                    </div>

                    {/* Right panel: Caption, likes, comments (separate card) */}
                    <div className="flex flex-col min-h-0 w-[min(400px,40vw)] min-w-[280px] max-h-[85vh] rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] overflow-hidden">
                    {/* Author + caption */}
                    <div className="p-4 border-b border-[var(--theme-border)] shrink-0">
                        <div className="flex items-center gap-3 mb-2">
                            <Link
                                to={`/profile/${post.user?.username}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-3 hover:opacity-90"
                            >
                                <Avatar
                                    src={post.user?.profile_picture}
                                    alt={post.user?.name}
                                    size="sm"
                                    className="w-9 h-9"
                                />
                                <div>
                                    <p className="font-semibold text-[var(--text-primary)] text-sm">
                                        {post.user?.name}
                                    </p>
                                    <p className="text-xs text-[var(--text-secondary)]">
                                        @{post.user?.username}
                                    </p>
                                </div>
                            </Link>
                        </div>
                        {post.content?.trim() && (
                            <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap mt-2">
                                {post.content}
                            </p>
                        )}
                        {post.created_at && (
                            <p className="text-xs text-[var(--text-secondary)] mt-2">
                                {formatDate(post.created_at)}
                            </p>
                        )}
                    </div>

                    {/* Like + comment counts */}
                    <div className="flex items-center gap-4 px-4 py-3 border-b border-[var(--theme-border)] shrink-0">
                        <button
                            type="button"
                            onClick={handleLike}
                            disabled={likeMutation.isPending || unlikeMutation.isPending}
                            className={`flex items-center gap-2 min-w-[44px] min-h-[44px] -mx-1 rounded-xl transition-colors disabled:opacity-60 ${
                                isLiked
                                    ? 'text-rose-500'
                                    : 'text-[var(--text-secondary)] hover:text-rose-500 hover:bg-[var(--theme-surface-hover)]'
                            }`}
                        >
                            <span
                                className={`material-symbols-outlined text-[22px] ${isLiked ? 'text-rose-500 fill-rose-500' : 'text-[var(--text-secondary)]'}`}
                            >
                                favorite
                            </span>
                            <span className="text-sm font-medium">
                                {likesCount > 999 ? `${(likesCount / 1000).toFixed(1)}k` : likesCount}
                            </span>
                        </button>
                        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                            <span className="material-symbols-outlined text-[22px]">chat_bubble</span>
                            <span className="text-sm font-medium">{Math.max(post.comments_count ?? 0, topLevelComments.length)}</span>
                        </div>
                        {recentLikers.length > 0 && (
                            <div className="flex -space-x-2">
                                {recentLikers.slice(0, 4).map((l) => (
                                    <Link
                                        key={l?.id}
                                        to={`/profile/${l?.username}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="block rounded-full ring-2 ring-[var(--theme-surface)] w-6 h-6 overflow-hidden shrink-0"
                                    >
                                        <Avatar src={l?.profile_picture} alt={l?.name} size="xs" className="w-6 h-6" />
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Comments list – scrolls when there are many comments */}
                    <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 space-y-4 overscroll-contain">
                        {commentsLoading ? (
                            <div className="flex justify-center py-8">
                                <LoadingSpinner size="sm" />
                            </div>
                        ) : topLevelComments.length === 0 ? (
                            <p className="text-sm text-[var(--text-secondary)] text-center py-4">
                                No comments yet.
                            </p>
                        ) : (
                            topLevelComments.map((comment) => (
                                <CommentThread key={comment.id} postId={post.id} comment={comment} />
                            ))
                        )}
                    </div>

                    {/* Add comment (only when logged in) */}
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
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
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

export default MediaView;
