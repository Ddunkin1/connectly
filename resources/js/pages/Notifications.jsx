import React from 'react';
import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from '../hooks/useNotifications';
import { useAcceptFriendRequest, useRejectFriendRequest } from '../hooks/useFriendRequests';
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
import { useQuery } from '@tanstack/react-query';
import { notificationsAPI } from '../services/api';
import { Link } from 'react-router-dom';
import WarningModal from '../components/notifications/WarningModal';
import Avatar from '../components/common/Avatar';

// Group notifications by Today / This week / Earlier
function groupNotifications(notifications) {
    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const week  = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);

    const groups = { Today: [], 'This week': [], Earlier: [] };
    notifications.forEach((n) => {
        const d = new Date(n.created_at);
        if (d >= today)       groups['Today'].push(n);
        else if (d >= week)   groups['This week'].push(n);
        else                  groups['Earlier'].push(n);
    });
    return groups;
}

const Notifications = () => {
    const { data, isLoading } = useNotifications();
    const markAsReadMutation     = useMarkNotificationAsRead();
    const markAllAsReadMutation  = useMarkAllNotificationsAsRead();
    const acceptFriendRequestMutation = useAcceptFriendRequest();
    const rejectFriendRequestMutation = useRejectFriendRequest();
    const acceptInviteMutation   = useAcceptCommunityInviteAny();
    const declineInviteMutation  = useDeclineCommunityInviteAny();
    const approveSuggestedMutation = useApproveCommunityInviteAny();
    const rejectSuggestedMutation  = useRejectCommunityInviteAny();
    const approveJoinRequestMutation = useApproveJoinRequestAny();
    const rejectJoinRequestMutation  = useRejectJoinRequestAny();

    const { data: highlightsData, isLoading: highlightsLoading } = useQuery({
        queryKey: ['notification-highlights'],
        queryFn: () => notificationsAPI.getHighlights(),
        select: (res) => res.data?.highlights ?? {},
    });

    const notifications = data?.notifications || [];
    const unreadCount   = data?.unread_count ?? 0;
    const newFollowers  = highlightsData?.new_followers ?? [];
    const topPosts      = highlightsData?.top_posts ?? [];
    const [warningModalEventId, setWarningModalEventId] = React.useState(null);

    const groups = groupNotifications(notifications);
    const groupKeys = Object.keys(groups).filter((k) => groups[k].length > 0);

    const itemProps = {
        onMarkAsRead:              (id) => markAsReadMutation.mutate(id),
        onOpenWarning:             (eventId) => setWarningModalEventId(eventId),
        onAcceptFriendRequest:     (frid) => acceptFriendRequestMutation.mutate(frid),
        onDeclineFriendRequest:    (frid) => rejectFriendRequestMutation.mutate(frid),
        onAcceptCommunityInvite:   (cid, iid) => acceptInviteMutation.mutate({ communityId: cid, inviteId: iid }),
        onDeclineCommunityInvite:  (cid, iid) => declineInviteMutation.mutate({ communityId: cid, inviteId: iid }),
        onApproveSuggestedInvite:  (cid, iid) => approveSuggestedMutation.mutate({ communityId: cid, inviteId: iid }),
        onRejectSuggestedInvite:   (cid, iid) => rejectSuggestedMutation.mutate({ communityId: cid, inviteId: iid }),
        onApproveJoinRequest:      (cid, jrid) => approveJoinRequestMutation.mutate({ communityId: cid, joinRequestId: jrid }),
        onRejectJoinRequest:       (cid, jrid) => rejectJoinRequestMutation.mutate({ communityId: cid, joinRequestId: jrid }),
    };

    return (
        <div className="w-full max-w-[680px] mx-auto pb-8 space-y-4">

            {/* ── Notifications card ── */}
            <div className="bg-[var(--theme-surface)] rounded-2xl border border-[var(--theme-border)] overflow-hidden">

                {/* Header */}
                <div className="px-5 py-4 flex items-center justify-between border-b border-[var(--theme-border)]">
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-base font-semibold text-[var(--text-primary)]">Notifications</h1>
                        {unreadCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--theme-accent)] text-white leading-none">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <button
                            type="button"
                            onClick={() => markAllAsReadMutation.mutate()}
                            disabled={markAllAsReadMutation.isPending}
                            className="text-xs font-medium text-[var(--theme-accent)] hover:opacity-70 transition-opacity disabled:opacity-40"
                        >
                            Mark all as read
                        </button>
                    )}
                </div>

                {/* Body */}
                {isLoading ? (
                    <div className="divide-y divide-[var(--theme-border)]">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                                <SkeletonBlock className="h-10 w-10 rounded-full shrink-0" />
                                <div className="flex-1 space-y-2 min-w-0">
                                    <SkeletonBlock className="h-3.5 w-3/4" />
                                    <SkeletonBlock className="h-2.5 w-1/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="py-16 flex flex-col items-center gap-3 text-center px-6">
                        <span className="material-symbols-outlined text-5xl text-[var(--text-secondary)]/30">notifications_off</span>
                        <p className="text-sm font-medium text-[var(--text-primary)]">You're all caught up</p>
                        <p className="text-xs text-[var(--text-secondary)] max-w-xs">
                            When someone likes your post, comments, follows you, or sends a friend request, it'll show up here.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-[var(--theme-border)]">
                        {groupKeys.map((group) => (
                            <div key={group}>
                                {/* Group label */}
                                <div className="px-5 py-2 bg-[var(--theme-surface-hover)]/50">
                                    <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
                                        {group}
                                    </p>
                                </div>
                                <div className="divide-y divide-[var(--theme-border)]">
                                    {groups[group].map((notification) => (
                                        <NotificationItem
                                            key={notification.id}
                                            notification={notification}
                                            {...itemProps}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Highlights card ── */}
            <div className="bg-[var(--theme-surface)] rounded-2xl border border-[var(--theme-border)] overflow-hidden">
                <div className="px-5 py-4 border-b border-[var(--theme-border)]">
                    <h2 className="text-base font-semibold text-[var(--text-primary)]">Weekly highlights</h2>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">What happened in your world this week</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[var(--theme-border)]">
                    {/* New followers */}
                    <div className="p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-secondary)] mb-3">
                            New followers
                        </p>
                        {highlightsLoading ? (
                            <div className="space-y-3">
                                {[1,2].map((i) => (
                                    <div key={i} className="flex items-center gap-2.5">
                                        <SkeletonBlock className="w-8 h-8 rounded-full shrink-0" />
                                        <div className="space-y-1 flex-1">
                                            <SkeletonBlock className="h-3 w-24" />
                                            <SkeletonBlock className="h-2.5 w-16" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : newFollowers.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-4 text-center">
                                <span className="material-symbols-outlined text-3xl text-[var(--text-secondary)]/30">group</span>
                                <p className="text-xs text-[var(--text-secondary)]">No new followers yet this week</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {newFollowers.map((f) => (
                                    <Link
                                        key={f.id}
                                        to={`/profile/${f.username}`}
                                        className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-[var(--theme-surface-hover)] transition-colors"
                                    >
                                        <Avatar src={f.profile_picture} alt={f.name} size="sm" className="w-8 h-8 rounded-full shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-[var(--text-primary)] truncate">{f.name}</p>
                                            <p className="text-xs text-[var(--text-secondary)] truncate">@{f.username}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Top posts */}
                    <div className="p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-secondary)] mb-3">
                            Top posts this week
                        </p>
                        {highlightsLoading ? (
                            <div className="space-y-3">
                                {[1,2].map((i) => (
                                    <div key={i} className="space-y-1.5">
                                        <SkeletonBlock className="h-3 w-full" />
                                        <SkeletonBlock className="h-2.5 w-20" />
                                    </div>
                                ))}
                            </div>
                        ) : topPosts.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-4 text-center">
                                <span className="material-symbols-outlined text-3xl text-[var(--text-secondary)]/30">bar_chart</span>
                                <p className="text-xs text-[var(--text-secondary)]">Post something to see what performs best</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {topPosts.map((p) => (
                                    <Link
                                        key={p.id}
                                        to={`/post/${p.id}`}
                                        className="block px-2 py-2 rounded-xl hover:bg-[var(--theme-surface-hover)] transition-colors"
                                    >
                                        <p className="text-sm text-[var(--text-primary)] line-clamp-1">
                                            {p.content_preview || 'View post'}
                                        </p>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            <span className="flex items-center gap-1 text-[11px] text-[var(--text-secondary)]">
                                                <span className="material-symbols-outlined text-[13px]">favorite</span>
                                                {p.likes_count}
                                            </span>
                                            <span className="flex items-center gap-1 text-[11px] text-[var(--text-secondary)]">
                                                <span className="material-symbols-outlined text-[13px]">chat_bubble</span>
                                                {p.comments_count}
                                            </span>
                                        </div>
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
