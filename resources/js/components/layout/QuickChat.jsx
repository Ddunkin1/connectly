import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConversations } from '../../hooks/useConversations';
import Avatar from '../common/Avatar';
import LoadingSpinner from '../common/LoadingSpinner';
import useAuthStore from '../../store/authStore';

const QuickChat = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(true);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const user = useAuthStore((state) => state.user);
    const { data, isLoading } = useConversations();

    const conversations = data?.pages.flatMap((page) => page.data.conversations) || [];
    const recentConversations = conversations.slice(0, 5); // Show only 5 most recent

    return (
        <>
            {/* Quick Chat Widget */}
            <div className="fixed bottom-4 right-4 z-50">
                {!isCollapsed ? (
                    <div className="bg-white rounded-lg shadow-lg border border-gray-200 w-80 flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-3 border-b border-gray-200">
                            <div className="flex items-center space-x-2">
                                <div className="relative">
                                    <Avatar src={user?.profile_picture} alt={user?.name} size="sm" />
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                                </div>
                                <span className="text-sm font-medium text-gray-900">Quick Chat</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setIsCollapsed(true)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                    title="Collapse"
                                >
                                    <span className="material-symbols-outlined text-lg">expand_less</span>
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                    title="Close"
                                >
                                    <span className="material-symbols-outlined text-lg">close</span>
                                </button>
                            </div>
                        </div>

                        {/* Chat List - Always visible when not collapsed */}
                        <div className="flex-1 overflow-y-auto max-h-96">
                            {isLoading ? (
                                <div className="flex justify-center py-4">
                                    <LoadingSpinner size="sm" />
                                </div>
                            ) : recentConversations.length === 0 ? (
                                <div className="p-4 text-center">
                                    <p className="text-sm text-gray-500">No conversations yet</p>
                                </div>
                            ) : (
                                recentConversations.map((conversation) => {
                                    const otherUser = conversation.other_user;
                                    const lastMessage = conversation.last_message;
                                    return (
                                        <button
                                            key={conversation.id}
                                            onClick={() => navigate(`/messages/${otherUser?.username}`)}
                                            className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 border-b border-gray-100 transition-colors"
                                        >
                                            <div className="relative">
                                                <Avatar
                                                    src={otherUser?.profile_picture}
                                                    alt={otherUser?.name}
                                                    size="sm"
                                                />
                                                {conversation.unread_count > 0 && (
                                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                                        {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-1 text-left">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {otherUser?.name}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {lastMessage?.message || 'No messages yet'}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsCollapsed(false)}
                        className="bg-white rounded-lg shadow-lg border border-gray-200 px-4 py-2 flex items-center space-x-2 hover:bg-gray-50 transition-colors"
                    >
                        <div className="relative">
                            <Avatar src={user?.profile_picture} alt={user?.name} size="sm" />
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">Quick Chat</span>
                        <span className="material-symbols-outlined text-gray-400 text-lg">expand_more</span>
                    </button>
                )}
            </div>
        </>
    );
};

export default QuickChat;
