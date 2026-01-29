import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../common/Avatar';
import { formatDate } from '../../utils/formatDate';
import { useLikePost, useUnlikePost, useSharePost } from '../../hooks/usePosts';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const PostCard = ({ post }) => {
    const user = useAuthStore((state) => state.user);
    const likeMutation = useLikePost();
    const unlikeMutation = useUnlikePost();
    const shareMutation = useSharePost();

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
                    <div className="flex items-center space-x-2">
                        <Link
                            to={`/profile/${post.user?.username}`}
                            className="font-semibold text-gray-900 hover:text-[#359EFF]"
                        >
                            {post.user?.name}
                        </Link>
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
            </div>

            {/* Post Content */}
            <Link to={`/post/${post.id}`}>
                <p className="text-gray-900 mb-3 whitespace-pre-wrap">{highlightHashtags(post.content)}</p>
            </Link>

            {/* Media */}
            {post.media_url && (
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
                        className={`flex items-center space-x-2 ${
                            post.is_liked ? 'text-red-500' : 'text-gray-500'
                        } hover:text-red-500 transition-colors`}
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

                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            const url = `${window.location.origin}/post/${post.id}`;
                            navigator.clipboard.writeText(url).then(() => {
                                toast.success('Link copied to clipboard');
                            }).catch(() => {
                                toast.error('Could not copy link');
                            });
                            shareMutation.mutate(post.id);
                        }}
                        className="flex items-center space-x-2 text-gray-500 hover:text-[#359EFF] transition-colors"
                    >
                        <span className="material-symbols-outlined">share</span>
                        <span className="text-sm">{post.shares_count ?? 0}</span>
                    </button>

                    <button className="flex items-center space-x-2 text-gray-500 hover:text-[#359EFF] transition-colors">
                        <span className="material-symbols-outlined">bookmark_border</span>
                    </button>
                </div>
            </div>
        </article>
    );
};

export default PostCard;
