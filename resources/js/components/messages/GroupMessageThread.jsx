import React, { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useGroupConversationWithMessages } from '../../hooks/useGroupConversations';
import { getEcho } from '../../echo';
import Avatar from '../common/Avatar';
import LoadingSpinner from '../common/LoadingSpinner';
import { formatDate } from '../../utils/formatDate';
import useAuthStore from '../../store/authStore';

const GroupMessageThread = ({ groupId }) => {
    const user = useAuthStore((state) => state.user);
    const queryClient = useQueryClient();
    const { data, isLoading, error, isError } = useGroupConversationWithMessages(groupId);
    const messagesEndRef = useRef(null);

    const messages = data?.messages || [];

    // Subscribe to real-time group messages via Reverb
    useEffect(() => {
        if (!groupId) return;
        const echo = getEcho();
        if (!echo) return;

        const channel = echo.private(`group-conversation.${groupId}`);
        channel.listen('.GroupMessageSent', (payload) => {
            const newMessage = payload?.message;
            if (!newMessage) return;
            const currentUser = useAuthStore.getState().user;
            if (newMessage.sender?.id === currentUser?.id) return;

            queryClient.setQueryData(['group-conversation', groupId], (old) => {
                if (!old?.data) return old;
                const existing = old.data.messages || [];
                const exists = existing.some((m) => m.id === newMessage.id);
                if (exists) return old;
                return {
                    ...old,
                    data: {
                        ...old.data,
                        messages: [...existing, newMessage],
                    },
                };
            });
        });

        return () => {
            channel.stopListening('.GroupMessageSent');
            echo.leave(`group-conversation.${groupId}`);
        };
    }, [groupId, queryClient]);
    // Backend returns latest first; reverse for chronological display
    const orderedMessages = [...messages].reverse();

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [orderedMessages.length]);

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
                <p className="text-red-500 text-lg mb-2">Failed to load messages</p>
                <p className="text-gray-500 text-sm text-center">
                    {error?.response?.data?.message || 'An error occurred. Please try again.'}
                </p>
            </div>
        );
    }

    return (
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {orderedMessages.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                    <p className="text-gray-500">No messages yet. Start the conversation!</p>
                </div>
            ) : (
                orderedMessages.map((message) => {
                    const isOwnMessage = message.sender?.id === user?.id;
                    return (
                        <div
                            key={message.id}
                            className={`flex items-start space-x-3 ${
                                isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''
                            }`}
                        >
                            <Avatar
                                src={message.sender?.profile_picture}
                                alt={message.sender?.name}
                                size="sm"
                            />
                            <div
                                className={`flex flex-col max-w-xs lg:max-w-md ${
                                    isOwnMessage ? 'items-end' : 'items-start'
                                }`}
                            >
                                {!isOwnMessage && (
                                    <p className="text-xs font-medium text-gray-600 mb-0.5">
                                        {message.sender?.name}
                                    </p>
                                )}
                                <div
                                    className={`rounded-lg px-4 py-2 ${
                                        isOwnMessage
                                            ? 'bg-[#359EFF] text-white'
                                            : 'bg-gray-100 text-gray-900'
                                    }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                    {formatDate(message.created_at)}
                                    {(() => {
                                        const created = message.created_at ? new Date(message.created_at).getTime() : 0;
                                        const isJustNow = Date.now() - created < 15000;
                                        return isJustNow && <span className="text-[var(--theme-accent)] text-[10px] font-medium">· Just now</span>;
                                    })()}
                                </p>
                            </div>
                        </div>
                    );
                })
            )}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default GroupMessageThread;
