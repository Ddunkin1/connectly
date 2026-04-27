import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSuggestedUsers, useFollow } from '../../hooks/useUsers';
import { useFriendRequests, useAcceptFriendRequest, useRejectFriendRequest } from '../../hooks/useFriendRequests';
import { trendingAPI } from '../../services/api';
import Avatar from '../common/Avatar';
import LoadingSpinner from '../common/LoadingSpinner';

const useTrendingHashtags = () => useQuery({
    queryKey: ['trending-hashtags-sidebar'],
    queryFn: () => trendingAPI.getHashtags({ limit: 3 }),
    select: (data) => data.data.hashtags ?? [],
    staleTime: 5 * 60 * 1000,
});

const RightSidebar = () => {
    const { data: suggestedUsers = [], isLoading: usersLoading } = useSuggestedUsers();
    const { data: friendRequestsData, isLoading: requestsLoading } = useFriendRequests();
    const { data: trendingHashtags = [], isLoading: trendingLoading } = useTrendingHashtags();
    const acceptMutation = useAcceptFriendRequest();
    const rejectMutation = useRejectFriendRequest();
    const followMutation = useFollow();
    const [followedIds, setFollowedIds] = useState(new Set());

    const receivedRequests = friendRequestsData?.received ?? [];

    const handleFollow = (userId) => {
        followMutation.mutate(userId, {
            onSuccess: () => setFollowedIds((prev) => new Set([...prev, userId])),
        });
    };

    return (
        <aside className="w-full h-full px-5 py-6 overflow-y-auto">

            {/* Suggested People */}
            <section>
                <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">People you may know</h2>
                {usersLoading ? (
                    <div className="flex justify-center py-3"><LoadingSpinner size="sm" /></div>
                ) : suggestedUsers.length === 0 ? (
                    <p className="text-sm text-[var(--text-secondary)]">No suggestions yet.</p>
                ) : (
                    <div className="space-y-4">
                        {suggestedUsers.slice(0, 4).map((user) => {
                            const isFollowed = followedIds.has(user.id);
                            const isPending = followMutation.isPending && followMutation.variables === user.id;
                            return (
                                <div key={user.id} className="flex items-center justify-between gap-2">
                                    <Link to={`/profile/${user.username}`} className="flex items-center gap-2.5 min-w-0 flex-1">
                                        <Avatar src={user.profile_picture} alt={user.name} size="sm" className="w-8 h-8 rounded-full shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-[var(--text-primary)] truncate leading-tight">{user.name}</p>
                                            {user.username && (
                                                <p className="text-xs text-[var(--text-secondary)] truncate">@{user.username}</p>
                                            )}
                                        </div>
                                    </Link>
                                    <button
                                        type="button"
                                        disabled={isFollowed || isPending}
                                        onClick={() => handleFollow(user.id)}
                                        className={`text-xs px-3 py-1 rounded-full transition-all duration-150 whitespace-nowrap shrink-0 ${
                                            isFollowed
                                                ? 'bg-[var(--theme-surface)] text-[var(--text-secondary)] border border-[var(--theme-border)] cursor-default'
                                                : 'border border-[var(--theme-accent)] text-[var(--theme-accent)] hover:bg-[var(--theme-accent)] hover:text-white disabled:opacity-50'
                                        }`}
                                    >
                                        {isPending ? '...' : isFollowed ? 'Requested' : 'Follow'}
                                    </button>
                                </div>
                            );
                        })}
                        {suggestedUsers.length > 4 && (
                            <Link to="/connections" className="text-xs text-[var(--theme-accent)] hover:underline block mt-1">
                                Show more
                            </Link>
                        )}
                    </div>
                )}
            </section>

            {/* Connection Requests */}
            {receivedRequests.length > 0 && (
                <section className="border-t border-[var(--theme-border)] mt-5 pt-5">
                    <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Connection requests</h2>
                    {requestsLoading ? (
                        <div className="flex justify-center py-3"><LoadingSpinner size="sm" /></div>
                    ) : (
                        <div className="space-y-3">
                            {receivedRequests.slice(0, 3).map((request) => {
                                const sender = request.sender;
                                const isAccepting = acceptMutation.isPending && acceptMutation.variables === request.id;
                                const isRejecting = rejectMutation.isPending && rejectMutation.variables === request.id;
                                const isPending = isAccepting || isRejecting;
                                return (
                                    <div key={request.id} className="flex items-center gap-2.5">
                                        <Link to={`/profile/${sender?.username}`} className="shrink-0">
                                            <Avatar src={sender?.profile_picture} alt={sender?.name} size="sm" className="w-8 h-8 rounded-full" />
                                        </Link>
                                        <div className="flex-1 min-w-0">
                                            <Link to={`/profile/${sender?.username}`} className="text-sm font-medium text-[var(--text-primary)] hover:text-[var(--theme-accent)] truncate block leading-tight">
                                                {sender?.name}
                                            </Link>
                                            <div className="flex gap-2 mt-1">
                                                <button
                                                    type="button"
                                                    onClick={() => acceptMutation.mutate(request.id)}
                                                    disabled={isPending}
                                                    className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--theme-accent)] text-white hover:bg-[var(--theme-accent-hover)] transition-colors disabled:opacity-50"
                                                >
                                                    {isAccepting ? '...' : 'Accept'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => rejectMutation.mutate(request.id)}
                                                    disabled={isPending}
                                                    className="text-xs px-2.5 py-0.5 rounded-full border border-[var(--theme-border)] text-[var(--text-secondary)] hover:bg-[var(--theme-surface-hover)] transition-colors disabled:opacity-50"
                                                >
                                                    {isRejecting ? '...' : 'Decline'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            )}

            {/* Trending Topics */}
            <section className="border-t border-[var(--theme-border)] mt-5 pt-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-[var(--text-primary)]">Trending topics</h2>
                    <Link to="/explore" className="text-xs text-[var(--theme-accent)] hover:underline">See all</Link>
                </div>
                {trendingLoading ? (
                    <div className="flex justify-center py-3"><LoadingSpinner size="sm" /></div>
                ) : trendingHashtags.length === 0 ? (
                    <p className="text-sm text-[var(--text-secondary)]">No trending topics yet.</p>
                ) : (
                    <div className="space-y-0.5">
                        {trendingHashtags.map((trend) => (
                            <Link
                                key={trend.id}
                                to={`/hashtag/${trend.name}`}
                                className="block py-2 rounded-lg hover:bg-[var(--theme-surface-hover)] transition-colors -mx-2 px-2"
                            >
                                <p className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--theme-accent)] transition-colors">
                                    #{trend.name}
                                </p>
                                <p className="text-[11px] text-[var(--text-secondary)]">{trend.posts_count} posts</p>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

        </aside>
    );
};

export default RightSidebar;
