import React from 'react';
import { useConversations } from '../../hooks/useConversations';
import LoadingSpinner from '../common/LoadingSpinner';
import useAuthStore from '../../store/authStore';

const ConversationList = ({ onSelectConversation, selectedConversationId }) => {
    const user = useAuthStore((state) => state.user);
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        error,
        isError,
    } = useConversations();

    const conversations = data?.pages.flatMap((page) => page.data.conversations) || [];

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <LoadingSpinner />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col justify-center items-center h-full p-4">
                <p className="text-red-500 text-sm mb-2">Failed to load conversations</p>
                <p className="text-gray-500 text-xs text-center">
                    {error?.response?.data?.message || 'An error occurred. Please refresh the page.'}
                </p>
            </div>
        );
    }

    const lastMessagePreview = (lastMessage) => {
        if (!lastMessage) return '';
        if (lastMessage.attachment_url) {
            const t = lastMessage.attachment_type || 'image';
            return t === 'image' ? '📷 Photo' : t === 'video' ? '🎬 Video' : '📎 File';
        }
        return lastMessage.message || '';
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const now = new Date();
        const diff = now - d;
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
        return formatDate(dateStr);
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4">
                {conversations.length === 0 ? (
                    <div className="flex justify-center items-center py-12 px-4">
                        <p className="text-slate-500 text-sm text-center">No conversations yet</p>
                    </div>
                ) : (
                    <>
                        <div className="mb-2">
                            {conversations.map((conversation) => {
                                const otherUser = conversation.other_user;
                                const lastMessage = conversation.last_message;
                                const isSelected = selectedConversationId === conversation.id;
                                const preview = lastMessagePreview(lastMessage);

                                return (
                                    <button
                                        key={conversation.id}
                                        onClick={() => onSelectConversation(conversation)}
                                        className={`w-full p-3 rounded-2xl flex gap-3 cursor-pointer transition-all text-left mb-2 ${
                                            isSelected
                                                ? 'bg-primary/10 border border-primary/20'
                                                : 'hover:bg-[#16161E] border border-transparent'
                                        }`}
                                    >
                                        <div className="relative shrink-0">
                                            <img src={otherUser?.profile_picture} alt={otherUser?.name} className="w-12 h-12 rounded-full object-cover" />
                                            {conversation.unread_count > 0 && (
                                                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">{conversation.unread_count > 9 ? '9+' : conversation.unread_count}</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-0.5">
                                                <h3 className={`text-sm truncate ${isSelected ? 'font-bold' : 'font-semibold'}`}>{otherUser?.name}</h3>
                                                {isSelected && <span className="text-[10px] text-primary font-medium uppercase tracking-wider shrink-0 ml-1">Online</span>}
                                                {!isSelected && lastMessage && <span className="text-[10px] text-slate-400 shrink-0">{formatTime(lastMessage.created_at)}</span>}
                                            </div>
                                            {lastMessage && <p className={`text-xs truncate ${conversation.unread_count > 0 ? 'text-slate-300 font-medium' : 'text-slate-500'}`}>{preview}</p>}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="px-2 mt-6 mb-2">
                            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Requests</h4>
                        </div>
                        <div className="px-4 py-4">
                            <div className="p-4 border-2 border-dashed border-[#26262E] rounded-2xl text-center">
                                <p className="text-xs text-slate-400">No pending requests</p>
                            </div>
                        </div>
                    </>
                )}
            </div>
            {isFetchingNextPage && (
                <div className="flex justify-center py-2 border-t border-[#2A2A2A]">
                    <LoadingSpinner size="sm" />
                </div>
            )}
        </div>
    );
};

export default ConversationList;
