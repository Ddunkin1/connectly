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

    const lastMessagePreview = (lastMessage) => {
        if (!lastMessage) return 'No messages yet';
        if (lastMessage.attachment_url) {
            const t = lastMessage.attachment_type || 'image';
            return t === 'image' ? '📷 Photo' : t === 'video' ? '🎬 Video' : '📎 File';
        }
        return lastMessage.message || 'No messages yet';
    };

    return (
        <>
            {/* Quick Chat Widget */}
            <div className="fixed bottom-0 right-6 w-80 z-[60]">
                {!isCollapsed ? (
                    <div className="glass-effect rounded-t-2xl overflow-hidden shadow-2xl border-b-0">
                        <div className="flex items-center justify-between p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 rounded-t-2xl">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-sm font-bold text-white">Quick Chat</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setIsCollapsed(true)}
                                    className="text-slate-400 hover:text-white"
                                    title="Collapse"
                                >
                                    <span className="material-symbols-outlined text-[18px]">remove</span>
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-slate-400 hover:text-white"
                                    title="Close"
                                >
                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                            </div>
                        </div>

                        {/* Chat List */}
                        <div className="p-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                            {isLoading ? (
                                <div className="flex justify-center py-4">
                                    <LoadingSpinner size="sm" />
                                </div>
                            ) : recentConversations.length === 0 ? (
                                <div className="p-4 text-center">
                                    <p className="text-sm text-gray-400">No conversations yet</p>
                                </div>
                            ) : (
                                recentConversations.map((conversation) => {
                                    const otherUser = conversation.other_user;
                                    const lastMessage = conversation.last_message;
                                    return (
                                        <button
                                            key={conversation.id}
                                            onClick={() => navigate(`/messages/${otherUser?.username}`)}
                                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left bg-white/[0.03]"
                                        >
                                            <div className="relative shrink-0">
                                                <Avatar
                                                    src={otherUser?.profile_picture}
                                                    alt={otherUser?.name}
                                                    className="w-8 h-8 rounded-lg shrink-0"
                                                />
                                                {conversation.unread_count > 0 && (
                                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                                        {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-1 text-left min-w-0">
                                                <p className="text-sm font-medium text-white truncate">{otherUser?.name}</p>
                                                {otherUser?.username && (
                                                    <p className="text-xs text-gray-500 truncate">@{otherUser.username}</p>
                                                )}
                                                <p className="text-xs text-gray-400 truncate mt-0.5">
                                                    {lastMessagePreview(lastMessage) === '📷 Photo' ? 'Sent you a photo' : lastMessagePreview(lastMessage)}
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
                        className="glass-morphism rounded-2xl border border-primary/20 px-4 py-3 flex items-center space-x-2 hover:bg-white/5 transition-colors"
                    >
                        <div className="relative">
                            <Avatar src={user?.profile_picture} alt={user?.name} size="sm" />
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#252538] rounded-full"></span>
                        </div>
                        <span className="text-sm font-medium text-white">Quick Chat</span>
                        <span className="material-symbols-outlined text-gray-400 text-lg">expand_more</span>
                    </button>
                )}
            </div>
        </>
    );
};

export default QuickChat;
