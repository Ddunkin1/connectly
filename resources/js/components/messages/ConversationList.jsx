import React from 'react';
import { useConversations } from '../../hooks/useConversations';
import Avatar from '../common/Avatar';
import LoadingSpinner from '../common/LoadingSpinner';
import { formatDate } from '../../utils/formatDate';
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

    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                    <div className="flex justify-center items-center h-full p-4">
                        <p className="text-gray-500 text-center">No conversations yet</p>
                    </div>
                ) : (
                    conversations.map((conversation) => {
                        const otherUser = conversation.other_user;
                        const lastMessage = conversation.last_message;
                        const isSelected = selectedConversationId === conversation.id;

                        return (
                            <button
                                key={conversation.id}
                                onClick={() => onSelectConversation(conversation)}
                                className={`w-full flex items-center space-x-3 p-4 hover:bg-gray-50 border-b border-gray-100 transition-colors ${
                                    isSelected ? 'bg-blue-50' : ''
                                }`}
                            >
                                <div className="relative flex-shrink-0">
                                    <Avatar
                                        src={otherUser?.profile_picture}
                                        alt={otherUser?.name}
                                        size="md"
                                    />
                                    {conversation.unread_count > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                            {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="font-medium text-gray-900 truncate">
                                            {otherUser?.name}
                                        </p>
                                        {lastMessage && (
                                            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                                                {formatDate(lastMessage.created_at)}
                                            </span>
                                        )}
                                    </div>
                                    {lastMessage && (
                                        <p
                                            className={`text-sm truncate ${
                                                conversation.unread_count > 0
                                                    ? 'text-gray-900 font-medium'
                                                    : 'text-gray-500'
                                            }`}
                                        >
                                            {lastMessage.message}
                                        </p>
                                    )}
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
            {isFetchingNextPage && (
                <div className="flex justify-center py-2 border-t border-gray-200">
                    <LoadingSpinner size="sm" />
                </div>
            )}
        </div>
    );
};

export default ConversationList;
