import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useConversations } from '../../hooks/useConversations';
import { useFriendRequests, useAcceptFriendRequest, useRejectFriendRequest } from '../../hooks/useFriendRequests';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import useAuthStore from '../../store/authStore';

const RightSidebar = () => {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const { data: conversationsData, isLoading: conversationsLoading } = useConversations();
    const { data: friendRequestsData, isLoading: friendRequestsLoading } = useFriendRequests();
    const acceptMutation = useAcceptFriendRequest();
    const rejectMutation = useRejectFriendRequest();

    const conversations = conversationsData?.pages?.flatMap((p) => p.data?.conversations ?? []) ?? [];
    const recentConversations = conversations.slice(0, 5);
    const receivedRequests = friendRequestsData?.received ?? [];

    const handleCreatePost = () => {
        navigate('/home');
        window.dispatchEvent(new CustomEvent('open-create-post'));
    };

    return (
        <aside className="hidden xl:flex xl:flex-col w-80 theme-bg-sidebar border-l border-gray-700/50 h-screen sticky top-0 overflow-y-auto">
            <div className="p-4 space-y-6">
                {/* Top: Create button + user avatar */}
                <div className="flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={handleCreatePost}
                        className="flex-1 theme-accent hover:opacity-90 text-white font-medium py-2.5 px-4 rounded-xl transition-colors"
                    >
                        Create
                    </button>
                    {user && (
                        <Link to={`/profile/${user.username}`}>
                            <Avatar src={user.profile_picture} alt={user.name} size="sm" />
                        </Link>
                    )}
                </div>

                {/* Messages / Updates */}
                <div>
                    <h3 className="text-sm font-semibold text-white mb-3">Messages</h3>
                    {conversationsLoading ? (
                        <div className="flex justify-center py-4">
                            <LoadingSpinner size="sm" />
                        </div>
                    ) : recentConversations.length === 0 ? (
                        <div className="p-3 rounded-lg theme-surface text-center">
                            <p className="text-sm text-gray-400">No conversations yet</p>
                            <Link to="/messages" className="text-sm text-[var(--theme-accent)] hover:underline mt-1 inline-block">
                                Start a conversation
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {recentConversations.map((conversation) => {
                                const otherUser = conversation.other_user;
                                const lastMessage = conversation.last_message;
                                const preview = lastMessage?.message
                                    ? (lastMessage.message.length > 30
                                          ? lastMessage.message.slice(0, 30) + '...'
                                          : lastMessage.message)
                                    : 'No messages yet';
                                const status =
                                    conversation.unread_count > 0
                                        ? `${conversation.unread_count} new message${conversation.unread_count > 1 ? 's' : ''}`
                                        : preview;
                                return (
                                    <Link
                                        key={conversation.id}
                                        to={`/messages/${otherUser?.username}`}
                                        className="flex items-center gap-3 p-3 rounded-lg theme-surface hover:brightness-110 transition-colors"
                                    >
                                        <div className="relative flex-shrink-0">
                                            <Avatar
                                                src={otherUser?.profile_picture}
                                                alt={otherUser?.name}
                                                size="sm"
                                            />
                                            {conversation.unread_count > 0 && (
                                                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                                                    {conversation.unread_count > 9
                                                        ? '9+'
                                                        : conversation.unread_count}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">
                                                {otherUser?.name}
                                            </p>
                                            <p className="text-xs text-gray-400 truncate">{status}</p>
                                        </div>
                                    </Link>
                                );
                            })}
                            <Link
                                to="/messages"
                                className="block text-center text-sm text-[var(--theme-accent)] hover:underline py-2"
                            >
                                View all
                            </Link>
                        </div>
                    )}
                </div>

                {/* Requests */}
                <div>
                    <h3 className="text-sm font-semibold text-white mb-3">Requests</h3>
                    {friendRequestsLoading ? (
                        <div className="flex justify-center py-4">
                            <LoadingSpinner size="sm" />
                        </div>
                    ) : receivedRequests.length === 0 ? (
                        <div className="p-3 rounded-lg theme-surface text-center">
                            <p className="text-sm text-gray-400">No pending requests</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {receivedRequests.map((request) => {
                                const sender = request.sender;
                                const isAccepting =
                                    acceptMutation.isPending && acceptMutation.variables === request.id;
                                const isRejecting =
                                    rejectMutation.isPending && rejectMutation.variables === request.id;
                                const isPending = isAccepting || isRejecting;
                                return (
                                    <div
                                        key={request.id}
                                        className="flex flex-col gap-2 p-3 rounded-lg theme-surface hover:brightness-110 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Link
                                                to={`/profile/${sender?.username}`}
                                                className="flex-shrink-0"
                                            >
                                                <Avatar
                                                    src={sender?.profile_picture}
                                                    alt={sender?.name}
                                                    size="md"
                                                />
                                            </Link>
                                            <div className="flex-1 min-w-0">
                                                <Link
                                                    to={`/profile/${sender?.username}`}
                                                    className="text-sm font-medium text-white hover:text-[var(--theme-accent)] truncate block"
                                                >
                                                    {sender?.name}
                                                </Link>
                                                <p className="text-xs text-gray-400">
                                                    {sender?.followers_count != null
                                                        ? `${sender.followers_count} mutual ${sender.followers_count === 1 ? 'friend' : 'friends'}`
                                                        : 'Wants to connect'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="primary"
                                                onClick={() => acceptMutation.mutate(request.id)}
                                                disabled={isPending}
                                                loading={isAccepting}
                                                className="flex-1"
                                            >
                                                Accept
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => rejectMutation.mutate(request.id)}
                                                disabled={isPending}
                                                loading={isRejecting}
                                                className="flex-1"
                                            >
                                                Decline
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                            <Link
                                to="/notifications"
                                className="block text-center text-sm text-[var(--theme-accent)] hover:underline py-2"
                            >
                                View all
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default RightSidebar;
