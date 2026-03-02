import React from 'react';
import { useConversations } from '../../hooks/useConversations';
import LoadingSpinner from '../common/LoadingSpinner';
import useAuthStore from '../../store/authStore';
import { formatDate } from '../../utils/formatDate';

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
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        if (diff < 172800000) return 'Yesterday';
        return formatDate(dateStr);
    };

    const isJustNow = (dateStr) => {
        if (!dateStr) return false;
        return new Date() - new Date(dateStr) < 60000;
    };

    const pinnedConversations = []; // Could be driven by backend later
    const recentConversations = conversations.filter((c) => !pinnedConversations.includes(c.id));

    const renderConversationRow = (conversation) => {
        const otherUser = conversation.other_user;
        const lastMessage = conversation.last_message;
        const isSelected = selectedConversationId === conversation.id;
        const preview = lastMessagePreview(lastMessage);
        const justNow = lastMessage && isJustNow(lastMessage.created_at);

        return (
            <button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation)}
                className={`w-full px-3 py-2.5 rounded-xl flex gap-3 cursor-pointer transition-all duration-200 text-left ${
                    isSelected ? 'bg-[var(--theme-surface)]' : 'hover:bg-[var(--theme-surface-hover)]'
                }`}
            >
                <div className="relative shrink-0">
                    <img src={otherUser?.profile_picture} alt={otherUser?.name} className="w-11 h-11 rounded-full object-cover" />
                    {conversation.unread_count > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold px-1">{conversation.unread_count > 9 ? '9+' : conversation.unread_count}</span>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center gap-1 mb-0.5">
                        <h3 className="text-sm font-medium text-[var(--text-primary)] truncate">{otherUser?.name}</h3>
                        {lastMessage && (
                            <span className={`text-[10px] shrink-0 rounded ${justNow ? 'bg-primary/20 text-primary px-1.5 py-0.5' : 'text-[var(--text-primary)]/60'}`}>
                                {justNow ? 'Just now' : formatTime(lastMessage.created_at)}
                            </span>
                        )}
                    </div>
                    {lastMessage && <p className={`text-xs truncate ${conversation.unread_count > 0 ? 'text-[var(--text-primary)]/80' : 'text-[var(--text-primary)]/60'}`}>{preview}</p>}
                </div>
            </button>
        );
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-2">
                {conversations.length === 0 ? (
                    <div className="flex justify-center items-center py-12 px-4">
                        <p className="text-[var(--text-primary)]/60 text-sm text-center">No conversations yet</p>
                    </div>
                ) : (
                    <>
                        {pinnedConversations.length > 0 && (
                            <>
                                <h4 className="text-[10px] font-semibold text-[var(--text-primary)]/60 uppercase tracking-wider px-2 mb-1 mt-2">PINNED</h4>
                                {conversations.filter((c) => pinnedConversations.includes(c.id)).map(renderConversationRow)}
                            </>
                        )}
                        <h4 className="text-[10px] font-semibold text-[var(--text-primary)]/60 uppercase tracking-wider px-2 mb-1 mt-2">RECENT</h4>
                        <div className="space-y-0.5">
                            {recentConversations.map(renderConversationRow)}
                        </div>
                    </>
                )}
            </div>
            {isFetchingNextPage && (
                <div className="flex justify-center py-2 border-t border-[var(--theme-border)]">
                    <LoadingSpinner size="sm" />
                </div>
            )}
        </div>
    );
};

export default ConversationList;
