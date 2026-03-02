import React from 'react';
import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from '../hooks/useNotifications';
import NotificationItem from '../components/notifications/NotificationItem';
import StoriesRow from '../components/feed/StoriesRow';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import { useQuery } from '@tanstack/react-query';
import { notificationsAPI } from '../services/api';
import { Link } from 'react-router-dom';

const Notifications = () => {
    const { data, isLoading } = useNotifications();
    const markAsReadMutation = useMarkNotificationAsRead();
    const markAllAsReadMutation = useMarkAllNotificationsAsRead();

    const { data: highlightsData, isLoading: highlightsLoading } = useQuery({
        queryKey: ['notification-highlights'],
        queryFn: () => notificationsAPI.getHighlights(),
        select: (res) => res.data?.highlights ?? {},
    });

    const notifications = data?.notifications || [];
    const unreadCount = data?.unread_count ?? 0;
    const newFollowers = highlightsData?.new_followers ?? [];
    const topPosts = highlightsData?.top_posts ?? [];

    const handleMarkAsRead = (id) => {
        markAsReadMutation.mutate(id);
    };

    return (
        <div className="w-full max-w-[800px] mx-auto">
            <StoriesRow />

            <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-hidden mb-6">
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

            <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--border-color)] flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-white">Highlights</h2>
                    {highlightsLoading && (
                        <span className="text-[11px] text-gray-400 flex items-center gap-1">
                            <LoadingSpinner size="xs" /> Loading
                        </span>
                    )}
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">
                            New followers
                        </p>
                        {newFollowers.length === 0 ? (
                            <p className="text-xs text-gray-500">
                                You don&apos;t have new followers this week yet.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {newFollowers.map((f) => (
                                    <Link
                                        key={f.id}
                                        to={`/profile/${f.username}`}
                                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5"
                                    >
                                        <div className="w-7 h-7 rounded-full overflow-hidden">
                                            <img
                                                src={f.profile_picture}
                                                alt={f.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs text-white truncate">{f.name}</p>
                                            <p className="text-[11px] text-gray-400 truncate">@{f.username}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">
                            Top posts this week
                        </p>
                        {topPosts.length === 0 ? (
                            <p className="text-xs text-gray-500">
                                Post something to see which content performs best.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {topPosts.map((p) => (
                                    <Link
                                        key={p.id}
                                        to={`/post/${p.id}`}
                                        className="block px-2 py-1.5 rounded-lg hover:bg-white/5"
                                    >
                                        <p className="text-xs text-white line-clamp-2">
                                            {p.content_preview || 'View post'}
                                        </p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">
                                            {p.likes_count} likes · {p.comments_count} comments
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Notifications;
