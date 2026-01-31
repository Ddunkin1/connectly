import React from 'react';
import { Link } from 'react-router-dom';
import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from '../hooks/useNotifications';
import NotificationItem from '../components/notifications/NotificationItem';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';

const Notifications = () => {
    const { data, isLoading } = useNotifications();
    const markAsReadMutation = useMarkNotificationAsRead();
    const markAllAsReadMutation = useMarkAllNotificationsAsRead();

    const notifications = data?.notifications || [];
    const unreadCount = data?.unread_count ?? 0;

    const handleMarkAsRead = (id) => {
        markAsReadMutation.mutate(id);
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-[#252538] rounded-xl border border-gray-700/50 shadow-sm">
                <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-white">Notifications</h1>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAllAsReadMutation.mutate()}
                            disabled={markAllAsReadMutation.isPending}
                        >
                            Mark all as read
                        </Button>
                    )}
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <LoadingSpinner />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <span className="material-symbols-outlined text-5xl text-gray-500 mb-4 block">
                            notifications
                        </span>
                        <p className="text-lg">No notifications yet</p>
                        <p className="text-sm mt-1">
                            When someone likes your post, comments, mentions you, or sends a friend request, you'll see it here.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-700">
                        {notifications.map((notification) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onMarkAsRead={handleMarkAsRead}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
