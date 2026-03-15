import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../common/Avatar';
import { UilHeart, UilHeartAlt, UilComment, UilShare, UilBookmark, UilBookmarkFull, UilEllipsisH, UilTrash, UilMegaphone, UilArchive, UilGlobe, UilUsersAlt, UilLock } from '../common/Icons';
import { formatDateUppercase } from '../../utils/formatDate';
import { useLikePost, useUnlikePost, useSharePost, useCreatePost, useDeletePost, useUpdatePost, useVotePoll } from '../../hooks/usePosts';
import { useAddBookmark, useRemoveBookmark } from '../../hooks/useBookmarks';
import ReportModal from '../common/ReportModal';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import SharePostModal from '../modal/SharePostModal';
import ShareViaMessageModal from './ShareViaMessageModal';
import CommentModal from '../modal/CommentModal';

const PostCard = ({ post, onDeleted }) => {
    const user = useAuthStore((state) => state.user);
    const likeMutation = useLikePost();
    const unlikeMutation = useUnlikePost();
    const shareMutation = useSharePost();
    const addBookmarkMutation = useAddBookmark();
    const removeBookmarkMutation = useRemoveBookmark();
    const createPostMutation = useCreatePost();
    const deleteMutation = useDeletePost();
    const updateMutation = useUpdatePost();
    const votePollMutation = useVotePoll();
    const [shareModalPost, setShareModalPost] = useState(null);
    const [shareViaMessagePost, setShareViaMessagePost] = useState(null);
    const [shareViaMessageInitialReceiver, setShareViaMessageInitialReceiver] = useState(null);
    const [commentModalPost, setCommentModalPost] = useState(null);
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
        <article className="bg-[var(--theme-surface)] overflow-hidden group mb-4 last:mb-0 p-5 rounded-2xl border border-[var(--theme-border)] shadow-post-card min-w-0 w-full">
            {/* Post Header - Stitch: avatar ring-2 ring-primary/20, 1 HOUR AGO, public icon */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                    <Link to={`/profile/${post.user?.username}`} className="shrink-0">
                        <Avatar src={post.user?.profile_picture} alt={post.user?.name} className="w-10 h-10 rounded-full ring-2 ring-primary/20" />
                    </Link>
                    <div>
                        <Link
                            to={`/profile/${post.user?.username}`}
                            className="font-bold text-sm text-[var(--text-primary)] hover:text-primary block"
                        >
                            {post.shared_post ? post.user?.username : post.user?.name}
                        </Link>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <span>{formatDateUppercase(post.created_at)}</span>
                            <span>•</span>
                            <span
                                className="material-symbols-outlined text-[14px] inline"
                                title={post.visibility === 'followers' ? 'Friends only' : post.visibility === 'private' ? 'Private' : 'Public'}
                            >
                                {post.visibility === 'followers' ? 'group' : post.visibility === 'private' ? 'lock' : 'public'}
                            </span>
                        </div>
                    </div>
                </div>
                {(isAuthor || user) && (
                    <div className="relative flex-shrink-0">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                setMoreOpen((open) => !open);
                            }}
                            className="p-2 hover:bg-white/5 rounded-xl transition-colors"
                            aria-label="More options"
                        >
                            <span className="material-symbols-outlined text-slate-400">more_horiz</span>
                        </button>
                        {moreOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    aria-hidden="true"
                                    onClick={() => setMoreOpen(false)}
                                />
                                <div className="absolute right-0 top-full mt-1 z-20 py-1 w-52 theme-surface rounded-lg border border-[var(--theme-border)] shadow-xl">
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
                                    <div className="border-t border-[var(--theme-border)] my-1" />
                                    <p className="px-4 py-1.5 text-xs text-[var(--text-secondary)] font-medium">Change visibility</p>
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
                                    <div className="border-t border-[var(--theme-border)] my-1" />
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
                    <p className="text-slate-100 whitespace-pre-wrap">{highlightHashtags(post.content || '')}</p>
                </div>
            )}

            {/* Original post embed (when this is a share) – content only, actions live on the sharing post */}
            {post.shared_post && (
                <div className="mb-2 rounded-lg border border-gray-600 overflow-hidden bg-[var(--theme-surface)]">
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
                        {post.shared_post.poll && (
                            <div className="mt-2 py-2">
                                <p className="text-xs font-medium text-gray-400 mb-2">{post.shared_post.poll.question}</p>
                                <div className="space-y-1">
                                    {post.shared_post.poll.options?.slice(0, 3).map((o) => (
                                        <div key={o.id} className="text-xs text-gray-500 flex justify-between">
                                            <span>{o.text}</span>
                                            {post.shared_post.poll.user_voted_option_id != null && (
                                                <span>{o.percentage}%</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {post.shared_post.media_url && (
                            <div className="mt-2 w-full min-w-0 rounded-xl overflow-hidden bg-black/20">
                                {post.shared_post.media_type === 'image' ? (
                                    <img
                                        src={post.shared_post.media_url}
                                        alt=""
                                        className="w-full max-w-full h-auto max-h-[420px] object-contain block"
                                    />
                                ) : (
                                    <video
                                        src={post.shared_post.media_url}
                                        className="w-full max-w-full max-h-[420px] object-contain"
                                        controls
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                )}
                            </div>
                        )}
                    </Link>
                </div>
            )}

            {/* Media first (reference order) — constrained so image fits in card, no cut-off */}
            {!post.shared_post && post.media_url && (
                <div className="mt-2 mb-1 w-full min-w-0 rounded-xl overflow-hidden bg-[var(--theme-surface)]">
                    {post.media_type === 'image' ? (
                        <img
                            src={post.media_url}
                            alt="Post media"
                            className="w-full max-w-full h-auto max-h-[420px] object-contain block"
                        />
                    ) : (
                        <video
                            src={post.media_url}
                            controls
                            className="w-full max-w-full h-auto max-h-[420px] object-contain block"
                        >
                            Your browser does not support the video tag.
                        </video>
                    )}
                </div>
            )}
            {/* Caption / text content
                - If there is media + content: show caption directly under media
                - If text-only (no media): show as full-width text block
            */}
            {!post.shared_post && post.content && (
                <div className="mt-3 mb-2">
                    <Link to={`/post/${post.id}`}>
                        <p className="text-base leading-relaxed whitespace-pre-wrap text-[var(--text-primary)]">
                            {highlightHashtags(post.content)}
                        </p>
                    </Link>
                </div>
            )}

            {/* Poll - for posts with poll */}
            {!post.shared_post && post.poll && (
                <div className="my-4 p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="font-medium text-white mb-3">{post.poll.question}</p>
                    <div className="space-y-2">
                        {post.poll.options?.map((opt) => {
                            const hasVoted = post.poll.user_voted_option_id != null;
                            const isSelected = post.poll.user_voted_option_id === opt.id;
                            return (
                                <button
                                    key={opt.id}
                                    type="button"
                                    disabled={hasVoted || votePollMutation.isPending}
                                    onClick={() => {
                                        if (!hasVoted && user) {
                                            votePollMutation.mutate({ postId: post.id, pollOptionId: opt.id });
                                        }
                                    }}
                                    className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                                        hasVoted
                                            ? isSelected
                                                ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/20'
                                                : 'border-white/10 bg-white/5'
                                            : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-[var(--text-primary)]">{opt.text}</span>
                                        {hasVoted && (
                                            <span className="text-sm text-slate-400">
                                                {opt.percentage}% ({opt.votes_count})
                                            </span>
                                        )}
                                    </div>
                                    {hasVoted && (
                                        <div
                                            className="mt-2 h-1 rounded-full bg-white/20 overflow-hidden"
                                            style={{ width: '100%' }}
                                        >
                                            <div
                                                className="h-full rounded-full bg-[var(--theme-accent)]"
                                                style={{ width: `${opt.percentage}%` }}
                                            />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    {post.poll.total_votes > 0 && (
                        <p className="text-xs text-slate-500 mt-2">{post.poll.total_votes} vote{post.poll.total_votes !== 1 ? 's' : ''}</p>
                    )}
                </div>
            )}

            {/* Post Actions - Stitch: like/comment/share left, bookmark right */}
            <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <div className="flex items-center gap-5">
                    <button
                        type="button"
                        onClick={handleLike}
                        disabled={isLikePendingFor(post.id)}
                        className={`flex items-center gap-2.5 min-w-[44px] min-h-[44px] py-2 px-3 -my-2 -mx-1 rounded-xl transition-colors group/btn cursor-pointer disabled:opacity-60 ${
                            post.is_liked
                                ? 'text-rose-500 hover:text-rose-500'
                                : 'text-[var(--text-secondary)] hover:text-rose-500'
                            } hover:bg-white/5`}
                        >
                            <span className={`material-symbols-outlined text-[22px] ${post.is_liked ? 'text-rose-500 fill-rose-500' : 'text-[var(--text-secondary)]'}`}>favorite</span>
                            <span className="text-xs font-medium">{(post.likes_count ?? 0) > 999 ? `${((post.likes_count ?? 0) / 1000).toFixed(1)}k` : post.likes_count ?? 0}</span>
                        </button>

                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                setCommentModalPost(post);
                            }}
                            className="flex items-center gap-2.5 min-w-[44px] min-h-[44px] py-2 px-3 -my-2 -mx-1 rounded-xl text-slate-400 hover:text-primary hover:bg-white/5 transition-colors cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-[22px]">chat_bubble</span>
                            <span className="text-xs font-medium">{post.comments_count ?? 0}</span>
                        </button>

                        <div className="flex-shrink-0">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setShareModalPost(post);
                                }}
                                className="flex items-center gap-2.5 min-w-[44px] min-h-[44px] py-2 px-3 -my-2 -mx-1 rounded-xl text-slate-400 hover:text-sky-500 hover:bg-white/5 transition-colors cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[22px]">share</span>
                                <span className="text-xs font-medium">{post.shares_count ?? 0}</span>
                            </button>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleBookmark}
                        disabled={isBookmarkPending}
                        className={`min-w-[44px] min-h-[44px] py-2 px-3 -my-2 -mr-3 rounded-xl transition-colors cursor-pointer disabled:opacity-60 ${
                            post.is_bookmarked ? 'text-primary' : 'text-slate-400 hover:text-primary hover:bg-white/5'
                        }`}
                    >
                        <span className={`material-symbols-outlined text-[22px] ${post.is_bookmarked ? 'fill-primary' : ''}`}>bookmark</span>
                    </button>
                </div>

                    {commentModalPost && (
                        <CommentModal
                            post={commentModalPost}
                            onClose={() => setCommentModalPost(null)}
                        />
                    )}
                    {shareModalPost && (
                        <SharePostModal
                            post={shareModalPost}
                            onClose={() => setShareModalPost(null)}
                            onShareToTimelineSubmit={(formData) => {
                                createPostMutation.mutate(
                                    { formData, sharedPost: shareModalPost },
                                    {
                                        onSuccess: () => {
                                            setShareModalPost(null);
                                            toast.success('Shared to your timeline');
                                        },
                                        onError: () => {},
                                    }
                                );
                            }}
                            isShareSubmitting={createPostMutation.isPending}
                            onSendToSomeone={(user) => {
                                setShareViaMessagePost(shareModalPost);
                                setShareViaMessageInitialReceiver(user);
                                setShareModalPost(null);
                            }}
                        />
                    )}
                    {shareViaMessagePost && (
                        <ShareViaMessageModal
                            post={shareViaMessagePost}
                            onClose={() => {
                                setShareViaMessagePost(null);
                                setShareViaMessageInitialReceiver(null);
                            }}
                            initialReceiver={shareViaMessageInitialReceiver}
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
                                                    className="block rounded-full ring-2 ring-[var(--theme-surface)] w-5 h-5 overflow-hidden shrink-0"
                                                >
                                                    <Avatar src={l?.profile_picture} alt={l?.name} size="xs" className="w-5 h-5" />
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                    <span className="text-sm text-[var(--text-secondary)]">
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
                {post.comments_count > 0 && (
                    <Link to={`/post/${post.id}`} className="text-sm text-gray-400 hover:text-[var(--theme-accent)] block">
                        View all {post.comments_count} comment{post.comments_count !== 1 ? 's' : ''}
                    </Link>
                )}

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
