import React from 'react';
import { Link } from 'react-router-dom';
import { useSuggestedUsers } from '../../hooks/useUsers';
import { useFriendRequests, useAcceptFriendRequest, useRejectFriendRequest } from '../../hooks/useFriendRequests';
import Avatar from '../common/Avatar';
import LoadingSpinner from '../common/LoadingSpinner';

const TRENDING = [
    { category: 'Technology', name: '#DesignSystems', posts: '54.2K posts' },
    { category: 'Community', name: '#SchoolLife', posts: '18.9K posts' },
    { category: 'General', name: '#ShipFaster', posts: '12.4K posts' },
];

const RightSidebar = () => {
    const { data: suggestedUsers = [], isLoading: usersLoading } = useSuggestedUsers();
    const { data: friendRequestsData, isLoading: requestsLoading } = useFriendRequests();
    const acceptMutation = useAcceptFriendRequest();
    const rejectMutation = useRejectFriendRequest();

    const receivedRequests = friendRequestsData?.received ?? [];

    return (
        <aside className="w-full h-full px-5 py-6 overflow-y-auto">

            {/* Suggested People */}
            <section>
                <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
                    People you may know
                </h2>
                {usersLoading ? (
                    <div className="flex justify-center py-3"><LoadingSpinner size="sm" /></div>
                ) : suggestedUsers.length === 0 ? (
                    <p className="text-sm text-[var(--text-secondary)]">No suggestions yet.</p>
                ) : (
                    <div className="space-y-4">
                        {suggestedUsers.slice(0, 4).map((user) => (
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
                                    className="border border-[var(--theme-accent)] text-[var(--theme-accent)] hover:bg-[var(--theme-accent)] hover:text-white text-xs px-3 py-1 rounded-full transition-all duration-150 whitespace-nowrap shrink-0"
                                >
                                    Follow
                                </button>
                            </div>
                        ))}
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
                    <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                        Connection requests
                    </h2>
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
                <div className="space-y-0.5">
                    {TRENDING.map((trend) => (
                        <Link
                            key={trend.name}
                            to={`/hashtag/${trend.name.replace('#', '')}`}
                            className="block py-2 rounded-lg hover:bg-[var(--theme-surface-hover)] transition-colors -mx-2 px-2"
                        >
                            <p className="text-[11px] text-[var(--text-secondary)]">{trend.category}</p>
                            <p className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--theme-accent)] transition-colors">{trend.name}</p>
                            <p className="text-[11px] text-[var(--text-secondary)]">{trend.posts}</p>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <div className="border-t border-[var(--theme-border)] mt-8 pt-5">
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--text-secondary)]">
                    <a href="#" className="hover:underline">Privacy</a>
                    <a href="#" className="hover:underline">Terms</a>
                    <a href="#" className="hover:underline">Safety</a>
                    <a href="#" className="hover:underline">About</a>
                </div>
                <p className="text-[11px] font-semibold text-[var(--theme-accent)] mt-1">Connectly</p>
            </div>
        </aside>
    );
};

export default RightSidebar;
