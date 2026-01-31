import React from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../common/Avatar';
import { formatDate } from '../../utils/formatDate';

const NotificationItem = ({ notification, onMarkAsRead }) => {
    const { id, type, data, read_at, created_at } = notification;
    const isUnread = !read_at;

    const getLink = () => {
        switch (type) {
            case 'friend_request':
                return `/profile/${data.sender_username}`;
            case 'like':
            case 'comment':
            case 'mention':
                return `/post/${data.post_id}`;
            default:
                return '#';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'friend_request':
                return 'person_add';
            case 'like':
                return 'favorite';
            case 'comment':
                return 'comment';
            case 'mention':
                return 'alternate_email';
            default:
                return 'notifications';
        }
    };

    const actorName = data.actor_name || data.sender_name;
    const actorUsername = data.actor_username || data.sender_username;
    const actorPicture = data.actor_profile_picture ?? data.sender_profile_picture;

    const handleClick = () => {
        if (isUnread && onMarkAsRead) {
            onMarkAsRead(id);
        }
    };

    return (
        <Link
            to={getLink()}
            onClick={handleClick}
            className={`flex items-start space-x-3 p-3 hover:bg-white/5 transition-colors border-b border-gray-700 last:border-0 ${
                isUnread ? 'bg-purple-500/10' : ''
            }`}
        >
            <div className="flex-shrink-0">
                <Avatar
                    src={actorPicture}
                    alt={actorName}
                    size="md"
                />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-white">
                    <span className="font-medium">{actorName}</span>
                    {' '}
                    <span className="text-gray-400">{data.message}</span>
                </p>
                {(data.post_preview || data.comment_preview) && (
                    <p className="text-xs text-gray-400 mt-1 truncate">
                        {data.post_preview || data.comment_preview}
                    </p>
                )}
                <p className="text-xs text-gray-500 mt-1">{formatDate(created_at)}</p>
            </div>
            <div className="flex-shrink-0">
                <span className="material-symbols-outlined text-gray-500 text-lg">
                    {getIcon()}
                </span>
            </div>
        </Link>
    );
};

export default NotificationItem;
