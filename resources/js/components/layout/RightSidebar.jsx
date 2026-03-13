import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { formatDate } from '../../utils/formatDate';
import { useConversations } from '../../hooks/useConversations';
import { useFriendRequests, useAcceptFriendRequest, useRejectFriendRequest } from '../../hooks/useFriendRequests';
import { useSuggestedUsers } from '../../hooks/useUsers';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';

const RightSidebar = () => {
    const location = useLocation();
    const isHomePage = location.pathname === '/home';

    const { data: suggestedUsers = [] } = useSuggestedUsers();

    const [messageSearch, setMessageSearch] = useState('');
    const [activeTab, setActiveTab] = useState('chats');
    const { data: conversationsData, isLoading: conversationsLoading } = useConversations();
    const { data: friendRequestsData, isLoading: friendRequestsLoading } = useFriendRequests();
    const acceptMutation = useAcceptFriendRequest();
    const rejectMutation = useRejectFriendRequest();

    const conversations = conversationsData?.pages?.flatMap((p) => p.data?.conversations ?? []) ?? [];
    const recentConversations = conversations.slice(0, 6);
    const receivedRequests = friendRequestsData?.received ?? [];

    const lastMessagePreview = (lastMessage) => {
        if (!lastMessage) return 'No messages yet';
        if (lastMessage.attachment_url) {
            const t = lastMessage.attachment_type || 'image';
            return t === 'image' ? '📷 Photo' : t === 'video' ? '🎬 Video' : '📎 File';
        }
        return lastMessage.message?.slice(0, 35) || 'No messages yet';
    };
    const requestsCount = receivedRequests.length;

    if (isHomePage) {
        return (
            <aside className="w-[260px] h-full px-4 py-5 overflow-y-auto space-y-5">
                {/* Trends card */}
                <div className="rounded-3xl bg-[var(--theme-surface)] border border-[var(--theme-border)] p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                            Trends for you
                        </h2>
                        <button
                            type="button"
                            className="text-[11px] text-[var(--text-primary)]/60 hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                        >
                            View all
                        </button>
                    </div>
                    <div className="space-y-4 text-sm">
                        {[
                            { category: 'Technology · Trending', name: '#DesignSystems', posts: '54.2K posts' },
                            { category: 'Business · Trending', name: '#RemoteWork2024', posts: '18.9K posts' },
                            { category: 'Development · Trending', name: '#ShipFaster', posts: '12.4K posts' },
                        ].map((trend) => (
                            <button
                                key={trend.name}
                                type="button"
                                className="w-full text-left group"
                            >
                                <p className="text-[11px] uppercase tracking-wide text-[var(--text-primary)]/50">
                                    {trend.category}
                                </p>
                                <p className="text-[var(--text-primary)] font-semibold group-hover:text-primary transition-colors">
                                    {trend.name}
                                </p>
                                <p className="text-[11px] text-[var(--text-primary)]/50 mt-0.5">
                                    {trend.posts}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Who to follow */}
                <div className="rounded-3xl bg-[var(--theme-surface)] border border-[var(--theme-border)] p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                            Who to follow
                        </h2>
                        <button
                            type="button"
                            className="text-[11px] text-[var(--text-primary)]/60 hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                        >
                            Show more
                        </button>
                    </div>
                    <div className="space-y-4">
                        {suggestedUsers.slice(0, 3).map((user) => (
                            <div key={user.id} className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <Avatar
                                        src={user.profile_picture}
                                        alt={user.name}
                                        size="sm"
                                    />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                                            {user.name}
                                        </p>
                                        {user.username && (
                                            <p className="text-xs text-[var(--text-primary)]/60 truncate">
                                                @{user.username}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="px-3 py-1.5 rounded-full bg-primary text-xs font-medium text-white hover:bg-primary/90 active:scale-[0.97] transition-all whitespace-nowrap cursor-pointer"
                                >
                                    Follow
                                </button>
                            </div>
                        ))}
                        {suggestedUsers.length === 0 && (
                            <p className="text-xs text-[var(--text-primary)]/60">
                                Follow more people to see suggestions here.
                            </p>
                        )}
                    </div>
                </div>
            </aside>
        );
    }

    return (
        <aside className="w-full h-full border-l border-white/5 px-4 py-5 bg-[var(--theme-bg-sidebar)] rounded-3xl overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Messages</h3>
                <Link to="/messages" className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 transition-colors" aria-label="Compose message">
                    <span className="material-symbols-outlined">filter_list</span>
                </Link>
            </div>
            <div className="relative mb-6">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
                <input
                    type="text"
                    value={messageSearch}
                    onChange={(e) => setMessageSearch(e.target.value)}
                    placeholder="Search messages"
                    className="w-full bg-white/5 border-none rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder:text-slate-500 focus:ring-1 focus:ring-primary outline-none"
                />
            </div>
            <div className="flex p-1 bg-white/5 rounded-xl mb-6">
                <button
                    type="button"
                    onClick={() => setActiveTab('chats')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        activeTab === 'chats' ? 'bg-primary text-white' : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                    Chats
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('requests')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        activeTab === 'requests' ? 'bg-primary text-white' : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                    Requests{requestsCount > 0 ? ` (${requestsCount})` : ''}
                </button>
            </div>

            {activeTab === 'chats' && (
                <>
                    {conversationsLoading ? (
                        <div className="flex justify-center py-4"><LoadingSpinner size="sm" /></div>
                    ) : recentConversations.length === 0 ? (
                        <div className="p-4 rounded-2xl bg-[var(--theme-surface)] text-center">
                            <p className="text-sm text-slate-500">No conversations yet</p>
                            <Link to="/messages" className="text-sm text-primary hover:underline mt-2 inline-block">Start a conversation</Link>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                            {recentConversations.map((conversation) => {
                                const otherUser = conversation.other_user;
                                const lastMessage = conversation.last_message;
                                const rawPreview = lastMessagePreview(lastMessage);
                                const friendlyPreview = rawPreview === '📷 Photo' ? 'Sent you a photo' : rawPreview === '🎬 Video' ? 'Sent you a video' : rawPreview;
                                const status = conversation.unread_count > 0 ? `${conversation.unread_count} new message${conversation.unread_count > 1 ? 's' : ''}` : friendlyPreview;
                                return (
                                    <Link
                                        key={conversation.id}
                                        to={`/messages/${otherUser?.username}`}
                                        className="group flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                                    >
                                        <div className="relative shrink-0">
                                            <Avatar src={otherUser?.profile_picture} alt={otherUser?.name} size="md" className="w-11 h-11 rounded-full object-cover" />
                                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[var(--theme-bg-sidebar)] rounded-full" />
                                            {conversation.unread_count > 0 && (
                                                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{conversation.unread_count > 9 ? '9+' : conversation.unread_count}</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <h5 className="text-sm font-bold truncate text-white">{otherUser?.name}</h5>
                                                {lastMessage && <span className="text-[10px] text-slate-500 shrink-0">{formatDate(lastMessage.created_at)}</span>}
                                            </div>
                                            <p className="text-xs text-slate-500 truncate font-medium">{status}</p>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {activeTab === 'requests' && (
            <div>
                {friendRequestsLoading ? (
                    <div className="flex justify-center py-4"><LoadingSpinner size="sm" /></div>
                ) : receivedRequests.length === 0 ? (
                    <div className="flex items-center gap-2 py-3 px-3 rounded-xl bg-white/[0.02]">
                        <span className="material-symbols-outlined text-slate-500 text-lg">mark_email_unread</span>
                        <p className="text-xs text-slate-500">No pending requests</p>
                    </div>
                ) : (
                        <div className="space-y-4">
                            {receivedRequests.slice(0, 3).map((request) => {
                                const sender = request.sender;
                                const isAccepting = acceptMutation.isPending && acceptMutation.variables === request.id;
                                const isRejecting = rejectMutation.isPending && rejectMutation.variables === request.id;
                                const isPending = isAccepting || isRejecting;
                                return (
                                    <div key={request.id} className="p-4 rounded-xl theme-surface border border-white/5">
                                        <div className="flex items-center gap-3 mb-4">
                                            <Link to={`/profile/${sender?.username}`} className="shrink-0">
                                                <Avatar src={sender?.profile_picture} alt={sender?.name} size="lg" className="w-12 h-12" />
                                            </Link>
                                            <div className="flex-1 min-w-0">
                                                <Link to={`/profile/${sender?.username}`} className="text-sm font-medium text-white hover:text-[var(--theme-accent)] truncate block">
                                                    {sender?.name}
                                                </Link>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {sender?.followers_count != null ? `${sender.followers_count} mutual friends` : 'Wants to connect'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <Button size="sm" variant="primary" onClick={() => acceptMutation.mutate(request.id)} disabled={isPending} loading={isAccepting} className="flex-1 min-w-0">
                                                Accept
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => rejectMutation.mutate(request.id)} disabled={isPending} loading={isRejecting} className="flex-1 min-w-0">
                                                Decline
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
            </div>
            )}
        </aside>
    );
};

export default RightSidebar;
