import React from 'react';
import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from '../hooks/useNotifications';
import NotificationItem from '../components/notifications/NotificationItem';
import StoriesRow from '../components/feed/StoriesRow';
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
        <div className="w-full max-w-[800px] mx-auto">
            <StoriesRow />

            <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--border-color)] flex items-center justify-between">
                    <h1 className="text-lg font-semibold text-white">Notifications</h1>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAllAsReadMutation.mutate()}
                            disabled={markAllAsReadMutation.isPending}
                            className="text-[var(--theme-accent)] hover:bg-[var(--theme-accent)]/10"
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
                    <div className="p-12 text-center text-[#9CA3AF]">
                        <p className="text-base font-medium text-white/80">No notifications yet</p>
                        <p className="text-sm mt-1">
                            When someone likes your post, comments, mentions you, or accepts your friend request, you'll see it here.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-[var(--border-color)]">
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
