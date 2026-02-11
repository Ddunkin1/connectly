import React from 'react';
import { Link } from 'react-router-dom';
import { formatDateUppercase } from '../../utils/formatDate';
import { UilHeart, UilComment, UilShare, UilBookmark } from '../common/Icons';

const NotificationItem = ({ notification, onMarkAsRead }) => {
    const { id, type, data, read_at, created_at } = notification;
    const isUnread = !read_at;

    const getLink = () => {
        switch (type) {
            case 'friend_request':
                return `/profile/${data.sender_username}`;
            case 'friend_request_accepted':
                return `/profile/${data.actor_username}`;
            case 'like':
            case 'comment':
            case 'mention':
                return `/post/${data.post_id}`;
            default:
                return '#';
        }
    };

    const showPostButton = () => {
        if (['friend_request_accepted'].includes(type)) return true;
        return ['like', 'comment', 'mention'].includes(type) && data.post_id;
    };

    const actorName = data.actor_name || data.sender_name;

    const likesCount = data.likes_count ?? 0;
    const commentsCount = data.comments_count ?? 0;
    const hasPostPreview = data.media_url || (likesCount > 0 && type === 'like') || (type === 'like' && data.post_preview);

    const handleClick = () => {
        if (isUnread && onMarkAsRead) {
            onMarkAsRead(id);
        }
    };

    const content = (
        <div
            className={`flex flex-col gap-3 p-4 hover:bg-white/[0.03] transition-colors ${
                isUnread ? 'bg-[var(--theme-accent)]/5' : ''
            }`}
            onClick={handleClick}
        >
            {/* Simple row: text + timestamp + optional Post button */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">
                        {type === 'like' && likesCount > 1 ? (
                            <>
                                Liked by <span className="font-semibold">{actorName}</span> and{' '}
                                <span className="font-semibold">{likesCount - 1} others</span>
                            </>
                        ) : (
                            <>
                                <span className="font-semibold">{actorName}</span>{' '}
                                <span className="text-[#9CA3AF]">
                                    {type === 'friend_request' && 'sent you a friend request'}
                                    {type === 'friend_request_accepted' && 'accepted your friend request'}
                                    {type === 'like' && likesCount <= 1 && 'liked your post'}
                                    {type === 'comment' && 'commented on your post'}
                                    {type === 'mention' && (data.context === 'comment' ? 'mentioned you in a comment' : 'mentioned you in a post')}
                                </span>
                            </>
                        )}
                    </p>
                    <p className="text-xs text-[#6B7280] mt-1 uppercase tracking-wide">{formatDateUppercase(created_at)}</p>
                </div>
                {showPostButton() && (
                    <span className="shrink-0 px-4 py-2 rounded-full text-sm font-medium bg-[var(--theme-accent)] text-white">
                        Post
                    </span>
                )}
            </div>

            {/* Full post preview - for like/comment notifications with media or engagement */}
            {hasPostPreview && data.post_id && (data.media_url || data.post_preview) && (
                <div className="block rounded-xl border border-[#2A2A2A] overflow-hidden bg-[#1A1A2E]">
                    {data.media_url && (
                        <div className="aspect-video w-full bg-[#252538]">
                            {data.media_type === 'image' ? (
                                <img
                                    src={data.media_url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <video
                                    src={data.media_url}
                                    className="w-full h-full object-cover"
                                    muted
                                    playsInline
                                />
                            )}
                        </div>
                    )}
                    <div className="p-3">
                        <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-4">
                                <button type="button" className="text-gray-400 hover:text-red-500 transition-colors">
                                    <UilHeart size={20} color="currentColor" />
                                </button>
                                <button type="button" className="text-gray-400 hover:text-[var(--theme-accent)] transition-colors">
                                    <UilComment size={20} color="currentColor" />
                                </button>
                                <button type="button" className="text-gray-400 hover:text-white transition-colors">
                                    <UilShare size={20} color="currentColor" />
                                </button>
                            </div>
                            <button type="button" className="text-gray-400 hover:text-white transition-colors ml-auto">
                                <UilBookmark size={20} color="currentColor" />
                            </button>
                        </div>
                        {likesCount > 0 && (
                            <p className="text-xs text-[#9CA3AF] mb-1">
                                Liked by {actorName}
                                {likesCount > 1 && ` and ${likesCount - 1} others`}
                            </p>
                        )}
                        {data.post_preview && (
                            <p className="text-sm text-white line-clamp-2">{data.post_preview}</p>
                        )}
                        {commentsCount > 0 && (
                            <p className="text-xs text-[#6B7280] mt-1">
                                View all {commentsCount} comment{commentsCount !== 1 ? 's' : ''}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <Link to={getLink()} className="block">
            {content}
        </Link>
    );
};

export default NotificationItem;
