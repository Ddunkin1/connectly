import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../common/Avatar';
import { UilHeart, UilHeartAlt, UilComment, UilShare, UilBookmark, UilBookmarkFull, UilEllipsisH, UilTrash, UilMegaphone, UilArchive, UilGlobe, UilUsersAlt, UilLock } from '../common/Icons';
import { formatDateUppercase } from '../../utils/formatDate';
import { useLikePost, useUnlikePost, useSharePost, useCreatePost, useDeletePost, useUpdatePost } from '../../hooks/usePosts';
import { useAddBookmark, useRemoveBookmark } from '../../hooks/useBookmarks';
import ReportModal from '../common/ReportModal';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import ShareToTimelineModal from './ShareToTimelineModal';

const PostCard = ({ post, onDeleted, onCommentClick }) => {
    const user = useAuthStore((state) => state.user);
    const likeMutation = useLikePost();
    const unlikeMutation = useUnlikePost();
    const shareMutation = useSharePost();
    const addBookmarkMutation = useAddBookmark();
    const removeBookmarkMutation = useRemoveBookmark();
    const createPostMutation = useCreatePost();
    const deleteMutation = useDeletePost();
    const updateMutation = useUpdatePost();
    const [shareOpen, setShareOpen] = useState(false);
    const [shareOpenInner, setShareOpenInner] = useState(false);
    const [shareToTimelinePost, setShareToTimelinePost] = useState(null);
    const [moreOpen, setMoreOpen] = useState(false);
    const [reportModalOpen, setReportModalOpen] = useState(false);

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

    const handleArchiveClick = () => {
        setMoreOpen(false);
        updateMutation.mutate(
            { postId: post.id, data: { is_archived: true } },
            {
                onSuccess: () => {
                    onDeleted?.();
                },
            }
        );
    };

    const handleVisibilityChange = (visibility) => {
        setMoreOpen(false);
        updateMutation.mutate({ postId: post.id, data: { visibility } });
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

    const handleBookmark = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const bookmarked = post.is_bookmarked ?? false;
        if (bookmarked) {
            removeBookmarkMutation.mutate(post.id);
        } else {
            addBookmarkMutation.mutate(post.id);
        }
    };

    const isBookmarkPending = addBookmarkMutation.isPending || removeBookmarkMutation.isPending;

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
            {/* Post Header - reference: name, location + timestamp, avatar with gradient ring */}
            <div className="flex items-start space-x-2 mb-2">
                <Link to={`/profile/${post.user?.username}`} className="shrink-0 block p-[3px] rounded-full bg-gradient-to-r from-yellow-400 via-orange-400 to-green-400">
                    <div className="rounded-full overflow-hidden w-8 h-8 bg-[#1A1A1A]">
                        <Avatar src={post.user?.profile_picture} alt={post.user?.name} size="sm" className="w-8 h-8" />
                    </div>
                </Link>
                <div className="flex-1 min-w-0">
                    <Link
                        to={`/profile/${post.user?.username}`}
                        className="font-semibold text-white hover:text-[var(--theme-accent)] block"
                    >
                        {post.user?.name}
                    </Link>
                    <p className="text-sm text-[#9CA3AF] flex items-center gap-1.5">
                        {[post.user?.location, formatDateUppercase(post.created_at)].filter(Boolean).join(', ')}
                        <span
                            className="inline-flex shrink-0 text-[#9CA3AF]/70"
                            title={post.visibility === 'followers' ? 'Friends only' : post.visibility === 'private' ? 'Private' : 'Public'}
                            aria-label={post.visibility === 'followers' ? 'Friends only' : post.visibility === 'private' ? 'Private' : 'Public'}
                        >
                            {post.visibility === 'followers' ? (
                                <UilUsersAlt size={12} color="currentColor" />
                            ) : post.visibility === 'private' ? (
                                <UilLock size={12} color="currentColor" />
                            ) : (
                                <UilGlobe size={12} color="currentColor" />
                            )}
                        </span>
                    </p>
                </div>
                {(isAuthor || user) && (
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
                                <div className="absolute right-0 top-full mt-1 z-20 py-1 w-52 theme-surface rounded-lg border border-[#2A2A2A] shadow-xl">
                                    {!isAuthor && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMoreOpen(false);
                                                setReportModalOpen(true);
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/20 flex items-center gap-2 cursor-pointer"
                                        >
                                            <UilMegaphone size={18} color="currentColor" />
                                            Report post
                                        </button>
                                    )}
                                    {isAuthor && (
                                    <>
                                    <button
                                        type="button"
                                        onClick={handleArchiveClick}
                                        disabled={updateMutation.isPending}
                                        className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                                    >
                                        <UilArchive size={18} color="currentColor" />
                                        Archive post
                                    </button>
                                    <div className="border-t border-[#2A2A2A] my-1" />
                                    <p className="px-4 py-1.5 text-xs text-[#9CA3AF] font-medium">Change visibility</p>
                                    <button
                                        type="button"
                                        onClick={() => handleVisibilityChange('public')}
                                        disabled={updateMutation.isPending}
                                        className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 cursor-pointer ${(post.visibility || 'public') === 'public' ? 'text-[var(--theme-accent)]' : 'text-gray-300 hover:bg-white/10'}`}
                                    >
                                        <UilGlobe size={18} color="currentColor" />
                                        Public
                                        {(post.visibility || 'public') === 'public' && ' ✓'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleVisibilityChange('followers')}
                                        disabled={updateMutation.isPending}
                                        className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 cursor-pointer ${post.visibility === 'followers' ? 'text-[var(--theme-accent)]' : 'text-gray-300 hover:bg-white/10'}`}
                                    >
                                        <UilUsersAlt size={18} color="currentColor" />
                                        Friends only
                                        {post.visibility === 'followers' && ' ✓'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleVisibilityChange('private')}
                                        disabled={updateMutation.isPending}
                                        className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 cursor-pointer ${post.visibility === 'private' ? 'text-[var(--theme-accent)]' : 'text-gray-300 hover:bg-white/10'}`}
                                    >
                                        <UilLock size={18} color="currentColor" />
                                        Private
                                        {post.visibility === 'private' && ' ✓'}
                                    </button>
                                    <div className="border-t border-[#2A2A2A] my-1" />
                                    <button
                                        type="button"
                                        onClick={handleDeleteClick}
                                        disabled={deleteMutation.isPending}
                                        className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/20 flex items-center gap-2 cursor-pointer"
                                    >
                                        <UilTrash size={18} color="currentColor" />
                                        Delete post
                                    </button>
                                    </>
                                    )}
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
                            className="w-full h-auto object-contain max-h-[70vh]"
                        />
                    ) : (
                        <video
                            src={post.media_url}
                            controls
                            className="w-full h-auto max-h-[70vh] object-contain"
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

            {/* Post Actions - heart, comment, share left; bookmark right (outline icons, no counts) */}
            <div className="pt-3 mt-2 border-t border-gray-700/50 space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button
                            type="button"
                            onClick={handleLike}
                            disabled={isLikePendingFor(post.id)}
                            className={`flex items-center flex-shrink-0 transition-colors cursor-pointer disabled:opacity-60 ${
                                post.is_liked
                                    ? 'text-red-500 hover:text-red-600'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            {post.is_liked ? (
                                <UilHeartAlt size={22} color="currentColor" />
                            ) : (
                                <UilHeart size={22} color="currentColor" />
                            )}
                        </button>

                        {onCommentClick ? (
                            <button
                                type="button"
                                onClick={onCommentClick}
                                className="flex items-center flex-shrink-0 text-gray-400 hover:text-[var(--theme-accent)] transition-colors cursor-pointer"
                            >
                                <UilComment size={22} color="currentColor" />
                            </button>
                        ) : (
                            <Link
                                to={`/post/${post.id}`}
                                className="flex items-center flex-shrink-0 text-gray-400 hover:text-[var(--theme-accent)] transition-colors cursor-pointer"
                            >
                                <UilComment size={22} color="currentColor" />
                            </Link>
                        )}

                        <div className="relative flex-shrink-0">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setShareOpen((open) => !open);
                                }}
                                className="flex items-center text-gray-400 hover:text-[var(--theme-accent)] transition-colors cursor-pointer"
                            >
                                <UilShare size={22} color="currentColor" />
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
                    </div>

                    <button
                        type="button"
                        onClick={handleBookmark}
                        disabled={isBookmarkPending}
                        className={`flex items-center flex-shrink-0 transition-colors cursor-pointer disabled:opacity-60 ${
                            post.is_bookmarked ? 'text-[var(--theme-accent)]' : 'text-gray-400 hover:text-[var(--theme-accent)]'
                        }`}
                    >
                        {(post.is_bookmarked ?? false) ? (
                            <UilBookmarkFull size={22} color="currentColor" />
                        ) : (
                            <UilBookmark size={22} color="currentColor" />
                        )}
                    </button>
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
                {(post.likes_count > 0 || post.is_liked) && (
                    <div className="flex items-center gap-2">
                        {(() => {
                            const likers = post.recent_likers ?? [];
                            const total = post.likes_count ?? 0;
                            const othersCount = Math.max(0, total - 1);
                            const displayLikers = post.is_liked && user
                                ? [user, ...likers.filter((l) => l?.id !== user?.id)].slice(0, 3)
                                : likers.slice(0, 3);
                            const firstLiker = displayLikers[0];

                            return (
                                <>
                                    {displayLikers.length > 0 && (
                                        <div className="flex -space-x-2">
                                            {displayLikers.map((l) => (
                                                <Link
                                                    key={l?.id}
                                                    to={`/profile/${l?.username}`}
                                                    className="block rounded-full ring-2 ring-[#1A1A1A] w-5 h-5 overflow-hidden shrink-0"
                                                >
                                                    <Avatar src={l?.profile_picture} alt={l?.name} size="xs" className="w-5 h-5" />
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                    <span className="text-sm text-[#9CA3AF]">
                                        {post.is_liked && user
                                            ? `Liked by you${othersCount > 0 ? ` and ${othersCount} others` : ''}`
                                            : firstLiker
                                                ? `Liked by ${firstLiker.name}${othersCount > 0 ? ` and ${othersCount} others` : ''}`
                                                : `${total} ${total === 1 ? 'like' : 'likes'}`}
                                    </span>
                                </>
                            );
                        })()}
                    </div>
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

            <ReportModal
                isOpen={reportModalOpen}
                onClose={() => setReportModalOpen(false)}
                reportableType="post"
                reportableId={post.id}
                title="Report post"
            />
        </article>
    );
};

export default PostCard;
