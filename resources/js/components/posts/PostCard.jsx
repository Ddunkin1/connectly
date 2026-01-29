import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../common/Avatar';
import { formatDate } from '../../utils/formatDate';
import { useLikePost, useUnlikePost, useSharePost, useCreatePost, useDeletePost } from '../../hooks/usePosts';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import ShareToTimelineModal from './ShareToTimelineModal';

const PostCard = ({ post, onDeleted }) => {
    const user = useAuthStore((state) => state.user);
    const likeMutation = useLikePost();
    const unlikeMutation = useUnlikePost();
    const shareMutation = useSharePost();
    const createPostMutation = useCreatePost();
    const deleteMutation = useDeletePost();
    const [shareOpen, setShareOpen] = useState(false);
    const [shareToTimelineOpen, setShareToTimelineOpen] = useState(false);
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

    const highlightHashtags = (text) => {
        const parts = text.split(/(#\w+)/g);
        return parts.map((part, index) => {
            if (part.startsWith('#')) {
                return (
                    <Link
                        key={index}
                        to={`/hashtag/${part.slice(1)}`}
                        className="text-[#359EFF] hover:underline"
                    >
                        {part}
                    </Link>
                );
            }
            return <span key={index}>{part}</span>;
        });
    };

    return (
        <article className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            {/* Post Header */}
            <div className="flex items-start space-x-3 mb-3">
                <Link to={`/profile/${post.user?.username}`}>
                    <Avatar src={post.user?.profile_picture} alt={post.user?.name} size="md" />
                </Link>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5">
                        <Link
                            to={`/profile/${post.user?.username}`}
                            className="font-semibold text-gray-900 hover:text-[#359EFF]"
                        >
                            {post.user?.name}
                        </Link>
                        {post.visibility === 'followers' ? (
                            <span
                                className="inline-flex items-center text-gray-500"
                                title="Friends only"
                            >
                                <span className="material-symbols-outlined text-sm">group</span>
                            </span>
                        ) : (
                            <span
                                className="inline-flex items-center text-gray-500"
                                title="Public"
                            >
                                <span className="material-symbols-outlined text-sm">public</span>
                            </span>
                        )}
                        <span className="text-gray-500">·</span>
                        <span className="text-sm text-gray-500">{formatDate(post.created_at)}</span>
                    </div>
                    <Link
                        to={`/profile/${post.user?.username}`}
                        className="text-sm text-gray-500 hover:text-[#359EFF]"
                    >
                        @{post.user?.username}
                    </Link>
                </div>
                {isAuthor && (
                    <div className="relative flex-shrink-0">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                setMoreOpen((open) => !open);
                            }}
                            className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
                            aria-label="More options"
                        >
                            <span className="material-symbols-outlined">more_horiz</span>
                        </button>
                        {moreOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    aria-hidden="true"
                                    onClick={() => setMoreOpen(false)}
                                />
                                <div className="absolute right-0 top-full mt-1 z-20 py-1 w-44 bg-white rounded-lg border border-gray-200 shadow-lg">
                                    <button
                                        type="button"
                                        onClick={handleDeleteClick}
                                        disabled={deleteMutation.isPending}
                                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-lg">delete</span>
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
                    <p className="text-gray-900 whitespace-pre-wrap">{highlightHashtags(post.content || '')}</p>
                </div>
            )}

            {/* Original post embed (when this is a share) */}
            {post.shared_post && (
                <Link to={`/post/${post.shared_post.id}`} className="block mb-3 rounded-lg border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors">
                    <div className="p-3 bg-gray-50">
                        <div className="flex items-center gap-2 mb-2">
                            <Avatar src={post.shared_post.user?.profile_picture} alt={post.shared_post.user?.name} size="sm" />
                            <div className="flex-1 min-w-0">
                                <span className="font-medium text-gray-900 text-sm">{post.shared_post.user?.name}</span>
                                <span className="text-gray-500 text-sm"> · @{post.shared_post.user?.username}</span>
                            </div>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-3">{post.shared_post.content || '—'}</p>
                        {post.shared_post.media_url && (
                            <div className="mt-2 rounded overflow-hidden max-h-48">
                                {post.shared_post.media_type === 'image' ? (
                                    <img src={post.shared_post.media_url} alt="" className="w-full h-auto object-cover" />
                                ) : (
                                    <video src={post.shared_post.media_url} className="w-full max-h-48" controls />
                                )}
                            </div>
                        )}
                    </div>
                </Link>
            )}

            {/* Post Content (only when not a share - shared content is above) */}
            {!post.shared_post && (
                <Link to={`/post/${post.id}`}>
                    <p className="text-gray-900 mb-3 whitespace-pre-wrap">{highlightHashtags(post.content)}</p>
                </Link>
            )}

            {/* Media (only when not a share) */}
            {!post.shared_post && post.media_url && (
                <div className="mb-3 rounded-lg overflow-hidden">
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

            {/* Post Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center space-x-6">
                    <button
                        onClick={handleLike}
                        className={`flex items-center space-x-2 transition-colors cursor-pointer ${
                            post.is_liked
                                ? 'text-red-500 hover:text-red-600'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <span className="material-symbols-outlined">
                            {post.is_liked ? 'favorite' : 'favorite_border'}
                        </span>
                        <span className="text-sm">{post.likes_count || 0}</span>
                    </button>

                    <Link
                        to={`/post/${post.id}`}
                        className="flex items-center space-x-2 text-gray-500 hover:text-[#359EFF] transition-colors"
                    >
                        <span className="material-symbols-outlined">chat_bubble_outline</span>
                        <span className="text-sm">{post.comments_count || 0}</span>
                    </Link>

                    <div className="relative">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                setShareOpen((open) => !open);
                            }}
                            className="flex items-center space-x-2 text-gray-500 hover:text-[#359EFF] transition-colors cursor-pointer"
                        >
                            <span className="material-symbols-outlined">share</span>
                            <span className="text-sm">{post.shares_count ?? 0}</span>
                        </button>
                        {shareOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    aria-hidden="true"
                                    onClick={() => setShareOpen(false)}
                                />
                                <div className="absolute left-0 top-full mt-1 z-20 py-1 w-52 bg-white rounded-lg border border-gray-200 shadow-lg">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShareOpen(false);
                                            setShareToTimelineOpen(true);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-lg">campaign</span>
                                        Share to my timeline
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const url = `${window.location.origin}/post/${post.id}`;
                                            navigator.clipboard.writeText(url).then(() => {
                                                toast.success('Shared with friends');
                                            }).catch(() => {
                                                toast.error('Could not share');
                                            });
                                            shareMutation.mutate(post.id);
                                            setShareOpen(false);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-sm">group</span>
                                        Copy link · Friends
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const url = `${window.location.origin}/post/${post.id}`;
                                            navigator.clipboard.writeText(url).then(() => {
                                                toast.success('Shared with public');
                                            }).catch(() => {
                                                toast.error('Could not share');
                                            });
                                            shareMutation.mutate(post.id);
                                            setShareOpen(false);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-sm">public</span>
                                        Copy link · Public
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {shareToTimelineOpen && (
                        <ShareToTimelineModal
                            post={post}
                            onClose={() => setShareToTimelineOpen(false)}
                            onSubmit={(formData) => {
                                createPostMutation.mutate(
                                    { formData, sharedPost: post },
                                    {
                                        onSuccess: () => {
                                            setShareToTimelineOpen(false);
                                            toast.success('Shared to your timeline');
                                        },
                                        onError: () => {
                                            toast.error('Failed to share');
                                        },
                                    }
                                );
                            }}
                            isSubmitting={createPostMutation.isPending}
                        />
                    )}

                    <button className="flex items-center space-x-2 text-gray-500 hover:text-[#359EFF] transition-colors cursor-pointer">
                        <span className="material-symbols-outlined">bookmark_border</span>
                    </button>
                </div>
            </div>
        </article>
    );
};

export default PostCard;
