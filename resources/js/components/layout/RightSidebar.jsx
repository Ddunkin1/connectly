import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useConversations } from '../../hooks/useConversations';
import { useFriendRequests, useAcceptFriendRequest, useRejectFriendRequest } from '../../hooks/useFriendRequests';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';

const RightSidebar = () => {
    const [messageSearch, setMessageSearch] = useState('');
    const [activeTab, setActiveTab] = useState('primary');
    const { data: conversationsData, isLoading: conversationsLoading } = useConversations();
    const { data: friendRequestsData, isLoading: friendRequestsLoading } = useFriendRequests();
    const acceptMutation = useAcceptFriendRequest();
    const rejectMutation = useRejectFriendRequest();

    const conversations = conversationsData?.pages?.flatMap((p) => p.data?.conversations ?? []) ?? [];
    const recentConversations = conversations.slice(0, 6);
    const receivedRequests = friendRequestsData?.received ?? [];
    const requestsCount = receivedRequests.length;

    return (
        <aside className="hidden xl:flex xl:flex-col w-[380px] shrink-0 overflow-y-auto sticky top-4 rounded-2xl shadow-lg mt-4 mb-4" style={{ backgroundColor: '#161616', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
            <div className="p-6 space-y-6">
                {/* Messages header: 20px bold + compose icon */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-white">Messages</h3>
                        <Link to="/messages" className="text-[#9CA3AF] hover:text-[var(--theme-accent)] p-1 rounded" aria-label="Compose message">
                            <span className="material-symbols-outlined text-[24px]">edit</span>
                        </Link>
                    </div>
                    <div className="relative mb-4">
                        <span className="material-symbols-outlined absolute left-[10px] top-1/2 -translate-y-1/2 text-[#9CA3AF] text-[20px]">search</span>
                        <input
                            type="text"
                            value={messageSearch}
                            onChange={(e) => setMessageSearch(e.target.value)}
                            placeholder="Search messages"
                            className="w-full h-10 pl-10 pr-4 bg-[#1A1A1A] border border-transparent rounded-[20px] text-sm text-white placeholder-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)]"
                        />
                    </div>
                    {/* Tabs: Primary, General, Requests - 14px medium, active purple underline */}
                    <div className="flex gap-6 mb-4 border-b border-[#2A2A2A] pb-3">
                        <button
                            type="button"
                            onClick={() => setActiveTab('primary')}
                            className={`text-sm font-medium transition-colors pb-3 border-b-2 -mb-[13px] ${
                                activeTab === 'primary' ? 'text-white border-[var(--theme-accent)]' : 'text-[#9CA3AF] hover:text-white border-transparent'
                            }`}
                        >
                            Primary
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('general')}
                            className={`text-sm font-medium transition-colors pb-3 border-b-2 -mb-[13px] ${
                                activeTab === 'general' ? 'text-white border-[var(--theme-accent)]' : 'text-[#9CA3AF] hover:text-white border-transparent'
                            }`}
                        >
                            General
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('requests')}
                            className={`text-sm font-medium transition-colors flex items-center gap-1 pb-3 border-b-2 -mb-[13px] ${
                                activeTab === 'requests' ? 'text-white border-[var(--theme-accent)]' : 'text-[#9CA3AF] hover:text-white border-transparent'
                            }`}
                        >
                            Requests
                            {requestsCount > 0 && (
                                <span className="bg-[var(--theme-accent)] text-white text-xs px-1.5 py-0.5 rounded-full">
                                    {requestsCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {conversationsLoading ? (
                        <div className="flex justify-center py-4"><LoadingSpinner size="sm" /></div>
                    ) : recentConversations.length === 0 ? (
                        <div className="p-4 rounded-xl theme-surface text-center">
                            <p className="text-sm text-gray-400">No conversations yet</p>
                            <Link to="/messages" className="text-sm text-[var(--theme-accent)] hover:underline mt-2 inline-block">
                                Start a conversation
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {recentConversations.map((conversation) => {
                                const otherUser = conversation.other_user;
                                const lastMessage = conversation.last_message;
                                const preview = lastMessage?.message?.slice(0, 35) || 'No messages yet';
                                const status = conversation.unread_count > 0 ? `${conversation.unread_count} new message${conversation.unread_count > 1 ? 's' : ''}` : preview;
                                return (
                                    <Link
                                        key={conversation.id}
                                        to={`/messages/${otherUser?.username}`}
                                        className="flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-[#1A1A1A] transition-colors"
                                    >
                                        <div className="relative shrink-0">
                                            <Avatar src={otherUser?.profile_picture} alt={otherUser?.name} size="sm" />
                                            {conversation.unread_count > 0 && (
                                                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                                                    {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-base font-medium text-white truncate">{otherUser?.name}</p>
                                            <p className="text-sm text-[#9CA3AF] truncate">{status}</p>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Requests - 16px medium, #1A1A1A bg, 12px radius */}
                <div>
                    <h3 className="text-base font-medium text-white mb-4">Requests</h3>
                    {friendRequestsLoading ? (
                        <div className="flex justify-center py-4"><LoadingSpinner size="sm" /></div>
                    ) : receivedRequests.length === 0 ? (
                        <div className="p-4 rounded-xl theme-surface text-center">
                            <p className="text-sm text-gray-400">No pending requests</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {receivedRequests.slice(0, 3).map((request) => {
                                const sender = request.sender;
                                const isAccepting = acceptMutation.isPending && acceptMutation.variables === request.id;
                                const isRejecting = rejectMutation.isPending && rejectMutation.variables === request.id;
                                const isPending = isAccepting || isRejecting;
                                return (
                                    <div key={request.id} className="p-3 rounded-xl theme-surface">
                                        <div className="flex items-center gap-3 mb-3">
                                            <Link to={`/profile/${sender?.username}`} className="shrink-0">
                                                <Avatar src={sender?.profile_picture} alt={sender?.name} size="lg" className="w-12 h-12" />
                                            </Link>
                                            <div className="flex-1 min-w-0">
                                                <Link to={`/profile/${sender?.username}`} className="text-sm font-medium text-white hover:text-[var(--theme-accent)] truncate block">
                                                    {sender?.name}
                                                </Link>
                                                <p className="text-xs text-gray-400">
                                                    {sender?.followers_count != null ? `${sender.followers_count} mutual friends` : 'Wants to connect'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="primary" onClick={() => acceptMutation.mutate(request.id)} disabled={isPending} loading={isAccepting} className="flex-1">
                                                Accept
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => rejectMutation.mutate(request.id)} disabled={isPending} loading={isRejecting} className="flex-1">
                                                Decline
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default RightSidebar;
