import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../common/Avatar';
import { UilHeart, UilHeartAlt, UilComment, UilShare, UilBookmark, UilEllipsisH, UilTrash, UilMegaphone } from '../common/Icons';
import { formatDateUppercase } from '../../utils/formatDate';
import { useLikePost, useUnlikePost, useSharePost, useCreatePost, useDeletePost } from '../../hooks/usePosts';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import ShareToTimelineModal from './ShareToTimelineModal';

const PostCard = ({ post, onDeleted, onCommentClick }) => {
    const user = useAuthStore((state) => state.user);
    const likeMutation = useLikePost();
    const unlikeMutation = useUnlikePost();
    const shareMutation = useSharePost();
    const createPostMutation = useCreatePost();
    const deleteMutation = useDeletePost();
    const [shareOpen, setShareOpen] = useState(false);
    const [shareOpenInner, setShareOpenInner] = useState(false);
    const [shareToTimelinePost, setShareToTimelinePost] = useState(null);
    const [moreOpen, setMoreOpen] = useState(false);

    const isAuthor = user?.id === post.user?.id;

    const handleDeleteClick = () => {
        setMoreOpen(false);
        if (!window.confirm('Delete this post? This cannot be undone.')) return;
        deleteMutation.mutate(post.id, {
            onSuccess: () => {
                onDeleted?.();
            },
        });
    };

    const handleLike = () => {
        if (post.is_liked) {
            unlikeMutation.mutate(post.id);
        } else {
            likeMutation.mutate(post.id);
        }
    };

    const handleLikeInner = (sharedPost) => (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (sharedPost.is_liked) {
            unlikeMutation.mutate(sharedPost.id);
        } else {
            likeMutation.mutate(sharedPost.id);
        }
    };

    const isLikePendingFor = (postId) =>
        (likeMutation.isPending && likeMutation.variables === postId) ||
        (unlikeMutation.isPending && unlikeMutation.variables === postId);

    const highlightHashtags = (text) => {
        const parts = text.split(/(#\w+)/g);
        return parts.map((part, index) => {
            if (part.startsWith('#')) {
                return (
                    <Link
                        key={index}
                        to={`/hashtag/${part.slice(1)}`}
                        className="text-[var(--theme-accent)] hover:underline"
                    >
                        {part}
                    </Link>
                );
            }
            return <span key={index}>{part}</span>;
        });
    };

    return (
        <article className="theme-surface rounded-[16px] p-4 mb-4 last:mb-0 lift-on-hover" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
            {/* Post Header - reference: name, location + timestamp */}
            <div className="flex items-start space-x-2 mb-2">
                <Link to={`/profile/${post.user?.username}`}>
                    <Avatar src={post.user?.profile_picture} alt={post.user?.name} size="sm" />
                </Link>
                <div className="flex-1 min-w-0">
                    <Link
                        to={`/profile/${post.user?.username}`}
                        className="font-semibold text-white hover:text-[var(--theme-accent)] block"
                    >
                        {post.user?.name}
                    </Link>
                    <p className="text-sm text-[#9CA3AF]">
                        {[post.user?.location, formatDateUppercase(post.created_at)].filter(Boolean).join(', ')}
                    </p>
                </div>
                {isAuthor && (
                    <div className="relative flex-shrink-0">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                setMoreOpen((open) => !open);
                            }}
                            className="p-1 rounded-full text-gray-400 hover:bg-white/10 hover:text-white cursor-pointer"
                            aria-label="More options"
                        >
                            <UilEllipsisH size={20} color="currentColor" />
                        </button>
                        {moreOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    aria-hidden="true"
                                    onClick={() => setMoreOpen(false)}
                                />
                                <div className="absolute right-0 top-full mt-1 z-20 py-1 w-44 theme-surface rounded-lg border border-[#2A2A2A] shadow-xl">
                                    <button
                                        type="button"
                                        onClick={handleDeleteClick}
                                        disabled={deleteMutation.isPending}
                                        className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/20 flex items-center gap-2 cursor-pointer"
                                    >
                                        <UilTrash size={18} color="currentColor" />
                                        Delete post
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Sharer's text (when this post is a share) */}
            {post.shared_post && (
                <div className="mb-3">
                    <p className="text-white whitespace-pre-wrap">{highlightHashtags(post.content || '')}</p>
                </div>
            )}

            {/* Original post embed (when this is a share) – content clickable to post; like/comment/share on embed */}
            {post.shared_post && (
                <div className="mb-2 rounded-lg border border-gray-600 overflow-hidden bg-[#1A1A2E]">
                    <Link
                        to={`/post/${post.shared_post.id}`}
                        className="block p-3 hover:bg-white/5 transition-colors"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <Avatar src={post.shared_post.user?.profile_picture} alt={post.shared_post.user?.name} size="sm" />
                            <div className="flex-1 min-w-0">
                                <span className="font-medium text-white text-sm">{post.shared_post.user?.name}</span>
                                <span className="text-gray-400 text-sm"> · @{post.shared_post.user?.username}</span>
                            </div>
                        </div>
                        <p className="text-sm text-gray-300 line-clamp-3">{post.shared_post.content || '—'}</p>
                        {post.shared_post.media_url && (
                            <div className="mt-2 rounded overflow-hidden max-h-48">
                                {post.shared_post.media_type === 'image' ? (
                                    <img src={post.shared_post.media_url} alt="" className="w-full h-auto object-cover" />
                                ) : (
                                    <video src={post.shared_post.media_url} className="w-full max-h-48" controls onClick={(e) => e.stopPropagation()} />
                                )}
                            </div>
                        )}
                    </Link>
                    <div className="flex items-center gap-4 px-3 py-2 border-t border-gray-600 bg-[#252538]/50">
                        <button
                            type="button"
                            onClick={handleLikeInner(post.shared_post)}
                            disabled={isLikePendingFor(post.shared_post.id)}
                            className={`flex items-center gap-1.5 flex-shrink-0 transition-colors cursor-pointer disabled:opacity-60 ${
                                post.shared_post.is_liked ? 'text-red-500 hover:text-red-400' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            {post.shared_post.is_liked ? (
                                <UilHeartAlt size={22} color="currentColor" />
                            ) : (
                                <UilHeart size={22} color="currentColor" />
                            )}
                            <span className="text-xs tabular-nums">{post.shared_post.likes_count ?? 0}</span>
                        </button>
                        <Link
                            to={`/post/${post.shared_post.id}`}
                            className="flex items-center gap-1.5 flex-shrink-0 text-gray-400 hover:text-[var(--theme-accent)] transition-colors cursor-pointer text-xs"
                        >
                            <UilComment size={22} color="currentColor" />
                            {post.shared_post.comments_count ?? 0}
                        </Link>
                        <div className="relative flex-shrink-0">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShareOpenInner((open) => !open);
                                }}
                                className="flex items-center gap-1.5 text-gray-400 hover:text-[var(--theme-accent)] transition-colors cursor-pointer text-xs"
                            >
                                <UilShare size={22} color="currentColor" />
                                {post.shared_post.shares_count ?? 0}
                            </button>
                            {shareOpenInner && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        aria-hidden="true"
                                        onClick={() => setShareOpenInner(false)}
                                    />
                                    <div className="absolute left-0 top-full mt-1 z-20 py-1 w-52 theme-surface rounded-lg border border-[#2A2A2A] shadow-xl">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShareOpenInner(false);
                                                setShareToTimelinePost(post.shared_post);
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                                        >
                                            <UilMegaphone size={18} color="currentColor" />
                                            Share to my timeline
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Media first (reference order), then text content for text-only posts */}
            {!post.shared_post && post.media_url && (
                <div className="mb-2 rounded-[12px] overflow-hidden">
                    {post.media_type === 'image' ? (
                        <img
                            src={post.media_url}
                            alt="Post media"
                            className="w-full h-auto max-h-96 object-cover"
                        />
                    ) : (
                        <video
                            src={post.media_url}
                            controls
                            className="w-full h-auto max-h-96"
                        >
                            Your browser does not support the video tag.
                        </video>
                    )}
                </div>
            )}
            {/* Text content - for text-only posts (no media) */}
            {!post.shared_post && !post.media_url && post.content && (
                <Link to={`/post/${post.id}`}>
                    <p className="text-white text-sm mb-2 whitespace-pre-wrap">{highlightHashtags(post.content)}</p>
                </Link>
            )}

            {/* Post Actions - reference: heart, comment, share, bookmark icons + Liked by line + View comments */}
            <div className="pt-3 mt-2 border-t border-gray-700/50 space-y-2">
                <div className="flex items-center gap-6">
                    <button
                        type="button"
                        onClick={handleLike}
                        disabled={isLikePendingFor(post.id)}
                        className={`flex items-center gap-2 w-14 flex-shrink-0 transition-colors cursor-pointer disabled:opacity-60 ${
                            post.is_liked
                                ? 'text-red-500 hover:text-red-600'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        {post.is_liked ? (
                            <UilHeartAlt size={22} className="flex-shrink-0" color="currentColor" />
                        ) : (
                            <UilHeart size={22} className="flex-shrink-0" color="currentColor" />
                        )}
                        <span className="text-sm tabular-nums w-5 text-left">{post.likes_count ?? 0}</span>
                    </button>

                    {onCommentClick ? (
                        <button
                            type="button"
                            onClick={onCommentClick}
                            className="flex items-center gap-2 w-14 flex-shrink-0 text-gray-400 hover:text-[var(--theme-accent)] transition-colors cursor-pointer"
                        >
                            <UilComment size={22} className="flex-shrink-0" color="currentColor" />
                            <span className="text-sm tabular-nums w-5 text-left">{post.comments_count ?? 0}</span>
                        </button>
                    ) : (
                        <Link
                            to={`/post/${post.id}`}
                            className="flex items-center gap-2 w-14 flex-shrink-0 text-gray-400 hover:text-[var(--theme-accent)] transition-colors cursor-pointer"
                        >
                            <UilComment size={22} className="flex-shrink-0" color="currentColor" />
                            <span className="text-sm tabular-nums w-5 text-left">{post.comments_count ?? 0}</span>
                        </Link>
                    )}

                    <div className="relative w-14 flex-shrink-0">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                setShareOpen((open) => !open);
                            }}
                            className="flex items-center gap-2 w-full text-gray-400 hover:text-[var(--theme-accent)] transition-colors cursor-pointer"
                        >
                            <UilShare size={22} className="flex-shrink-0" color="currentColor" />
                            <span className="text-sm tabular-nums w-5 text-left">{post.shares_count ?? 0}</span>
                        </button>
                        {shareOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    aria-hidden="true"
                                    onClick={() => setShareOpen(false)}
                                />
                                <div className="absolute left-0 top-full mt-1 z-20 py-1 w-52 theme-surface rounded-lg border border-[#2A2A2A] shadow-xl">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShareOpen(false);
                                            setShareToTimelinePost(post);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                                    >
                                        <UilMegaphone size={18} color="currentColor" />
                                        Share to my timeline
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {shareToTimelinePost && (
                        <ShareToTimelineModal
                            post={shareToTimelinePost}
                            onClose={() => setShareToTimelinePost(null)}
                            onSubmit={(formData) => {
                                createPostMutation.mutate(
                                    { formData, sharedPost: shareToTimelinePost },
                                    {
                                        onSuccess: () => {
                                            setShareToTimelinePost(null);
                                            toast.success('Shared to your timeline');
                                        },
                                        onError: () => {},
                                    }
                                );
                            }}
                            isSubmitting={createPostMutation.isPending}
                        />
                    )}

                    <button className="flex items-center justify-start w-14 flex-shrink-0 text-gray-400 hover:text-[var(--theme-accent)] transition-colors cursor-pointer">
                        <UilBookmark size={22} className="flex-shrink-0" color="currentColor" />
                    </button>
                </div>
                {(post.likes_count > 0 || post.is_liked) && (
                    <p className="text-sm text-white">
                        {post.is_liked && user
                            ? `Liked by you${(post.likes_count ?? 0) > 1 ? ` and ${(post.likes_count ?? 1) - 1} others` : ''}`
                            : `${post.likes_count ?? 0} ${(post.likes_count ?? 0) === 1 ? 'like' : 'likes'}`}
                    </p>
                )}
                {/* Caption for media posts - author + content (reference format) */}
                {!post.shared_post && post.content && post.media_url && (
                    <p className="text-sm text-white">
                        <Link to={`/profile/${post.user?.username}`} className="font-semibold hover:text-[var(--theme-accent)]">
                            {post.user?.name}
                        </Link>
                        {' '}
                        {highlightHashtags(post.content)}
                    </p>
                )}
                {post.comments_count > 0 && (
                    <Link to={`/post/${post.id}`} className="text-sm text-gray-400 hover:text-[var(--theme-accent)] block">
                        View all {post.comments_count} comment{post.comments_count !== 1 ? 's' : ''}
                    </Link>
                )}
            </div>
        </article>
    );
};

export default PostCard;
