import React from 'react';
import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from '../hooks/useNotifications';
import {
    useAcceptCommunityInviteAny,
    useDeclineCommunityInviteAny,
    useApproveCommunityInviteAny,
    useRejectCommunityInviteAny,
    useApproveJoinRequestAny,
    useRejectJoinRequestAny,
} from '../hooks/useCommunities';
import NotificationItem from '../components/notifications/NotificationItem';
import { SkeletonBlock } from '../components/common/skeletons';
import Button from '../components/common/Button';
import { useQuery } from '@tanstack/react-query';
import { notificationsAPI } from '../services/api';
import { Link } from 'react-router-dom';
import WarningModal from '../components/notifications/WarningModal';

const Notifications = () => {
    const { data, isLoading } = useNotifications();
    const markAsReadMutation = useMarkNotificationAsRead();
    const markAllAsReadMutation = useMarkAllNotificationsAsRead();
    const acceptInviteMutation = useAcceptCommunityInviteAny();
    const declineInviteMutation = useDeclineCommunityInviteAny();
    const approveSuggestedMutation = useApproveCommunityInviteAny();
    const rejectSuggestedMutation = useRejectCommunityInviteAny();
    const approveJoinRequestMutation = useApproveJoinRequestAny();
    const rejectJoinRequestMutation = useRejectJoinRequestAny();

    const { data: highlightsData, isLoading: highlightsLoading } = useQuery({
        queryKey: ['notification-highlights'],
        queryFn: () => notificationsAPI.getHighlights(),
        select: (res) => res.data?.highlights ?? {},
    });

    const notifications = data?.notifications || [];
    const unreadCount = data?.unread_count ?? 0;
    const newFollowers = highlightsData?.new_followers ?? [];
    const topPosts = highlightsData?.top_posts ?? [];
    const [warningModalEventId, setWarningModalEventId] = React.useState(null);

    const handleMarkAsRead = (id) => {
        markAsReadMutation.mutate(id);
    };

    return (
        <div className="w-full max-w-[680px] mx-auto">
            <div className="bg-[var(--theme-surface)] rounded-xl border border-[var(--theme-border)] overflow-hidden mb-6">
                <div className="px-4 py-3 border-b border-[var(--theme-border)] flex items-center justify-between">
                    <h1 className="text-lg font-semibold text-[var(--text-primary)]">Notifications</h1>
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
                    <div className="divide-y divide-[var(--theme-border)]">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="flex gap-3 p-4">
                                <SkeletonBlock className="h-10 w-10 rounded-full shrink-0" />
                                <div className="flex-1 space-y-2 min-w-0">
                                    <SkeletonBlock className="h-4 w-full max-w-sm" />
                                    <SkeletonBlock className="h-3 w-full max-w-md" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-base font-medium text-[var(--text-primary)]">No notifications yet</p>
                        <p className="text-sm mt-1 text-[var(--text-secondary)]">
                            When someone likes your post, comments, mentions you, or accepts your friend request, you'll see it here.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-[var(--theme-border)]">
                        {notifications.map((notification) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onMarkAsRead={handleMarkAsRead}
                                onOpenWarning={(eventId) => setWarningModalEventId(eventId)}
                                onAcceptCommunityInvite={(cid, iid) => acceptInviteMutation.mutate({ communityId: cid, inviteId: iid })}
                                onDeclineCommunityInvite={(cid, iid) => declineInviteMutation.mutate({ communityId: cid, inviteId: iid })}
                                onApproveSuggestedInvite={(cid, iid) => approveSuggestedMutation.mutate({ communityId: cid, inviteId: iid })}
                                onRejectSuggestedInvite={(cid, iid) => rejectSuggestedMutation.mutate({ communityId: cid, inviteId: iid })}
                                onApproveJoinRequest={(cid, jrid) => approveJoinRequestMutation.mutate({ communityId: cid, joinRequestId: jrid })}
                                onRejectJoinRequest={(cid, jrid) => rejectJoinRequestMutation.mutate({ communityId: cid, joinRequestId: jrid })}
                            />
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-[var(--theme-surface)] rounded-xl border border-[var(--theme-border)] overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--theme-border)] flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-[var(--text-primary)]">Highlights</h2>
                    {highlightsLoading && (
                        <span className="text-[11px] text-[var(--text-secondary)] flex items-center gap-2">
                            <SkeletonBlock className="h-3 w-16 rounded" /> Loading
                        </span>
                    )}
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-2">
                            New followers
                        </p>
                        {newFollowers.length === 0 ? (
                            <p className="text-xs text-[var(--text-secondary)]">
                                You don&apos;t have new followers this week yet.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {newFollowers.map((f) => (
                                    <Link
                                        key={f.id}
                                        to={`/profile/${f.username}`}
                                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--theme-surface-hover)]"
                                    >
                                        <div className="w-7 h-7 rounded-full overflow-hidden">
                                            <img
                                                src={f.profile_picture}
                                                alt={f.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs text-[var(--text-primary)] truncate">{f.name}</p>
                                            <p className="text-[11px] text-[var(--text-secondary)] truncate">@{f.username}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-2">
                            Top posts this week
                        </p>
                        {topPosts.length === 0 ? (
                            <p className="text-xs text-[var(--text-secondary)]">
                                Post something to see which content performs best.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {topPosts.map((p) => (
                                    <Link
                                        key={p.id}
                                        to={`/post/${p.id}`}
                                        className="block px-2 py-1.5 rounded-lg hover:bg-[var(--theme-surface-hover)]"
                                    >
                                        <p className="text-xs text-[var(--text-primary)] line-clamp-2">
                                            {p.content_preview || 'View post'}
                                        </p>
                                        <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                                            {p.likes_count} likes · {p.comments_count} comments
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <WarningModal
                eventId={warningModalEventId}
                isOpen={warningModalEventId != null}
                onClose={() => setWarningModalEventId(null)}
            />
        </div>
    );
};

export default Notifications;
