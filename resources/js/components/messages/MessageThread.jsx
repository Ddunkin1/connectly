import React, { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useMessages } from '../../hooks/useMessages';
import { getEcho } from '../../echo';
import Avatar from '../common/Avatar';
import LoadingSpinner from '../common/LoadingSpinner';
import { formatDate } from '../../utils/formatDate';
import useAuthStore from '../../store/authStore';

const MessageThread = ({ conversationId }) => {
    const user = useAuthStore((state) => state.user);
    const queryClient = useQueryClient();
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        error,
        isError,
    } = useMessages(conversationId);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);

    const messages = data?.pages.flatMap((page) => page.data.messages).reverse() || [];

    // Subscribe to real-time messages via Reverb
    useEffect(() => {
        if (!conversationId) return;
        const echo = getEcho();
        if (!echo) return;

        const channel = echo.private(`conversation.${conversationId}`);
        channel.listen('.MessageSent', (payload) => {
            const newMessage = payload?.message;
            if (!newMessage) return;
            // Skip if from current user (added optimistically from send response)
            const currentUser = useAuthStore.getState().user;
            if (newMessage.sender?.id === currentUser?.id) return;

            queryClient.setQueryData(['messages', conversationId], (old) => {
                if (!old?.pages?.length) {
                    queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
                    return old;
                }
                const pages = [...old.pages];
                const firstPage = pages[0];
                if (firstPage?.data?.messages) {
                    const exists = firstPage.data.messages.some((m) => m.id === newMessage.id);
                    if (!exists) {
                        pages[0] = {
                            ...firstPage,
                            data: {
                                ...firstPage.data,
                                messages: [newMessage, ...firstPage.data.messages],
                            },
                        };
                    }
                }
                return { ...old, pages };
            });

            // Refresh conversation list so unread badge and order update
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        });

        return () => {
            channel.stopListening('.MessageSent');
            echo.leave(`conversation.${conversationId}`);
        };
    }, [conversationId, queryClient]);

    // Scroll to bottom on new messages
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages.length]);

    // Handle scroll for infinite loading
    const handleScroll = () => {
        if (messagesContainerRef.current) {
            const { scrollTop } = messagesContainerRef.current;
            if (scrollTop === 0 && hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
            }
        }
    };

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
                    {error?.response?.data?.message || 'An error occurred while loading messages. Please try again.'}
                </p>
            </div>
        );
    }

    return (
        <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 space-y-4"
        >
            {isFetchingNextPage && (
                <div className="flex justify-center py-2">
                    <LoadingSpinner size="sm" />
                </div>
            )}
            {messages.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                    <p className="text-gray-500">No messages yet. Start the conversation!</p>
                </div>
            ) : (
                messages.map((message) => {
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
                                <div
                                    className={`rounded-lg px-4 py-2 ${
                                        isOwnMessage
                                            ? 'bg-[#359EFF] text-white'
                                            : 'bg-gray-100 text-gray-900'
                                    }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                    {formatDate(message.created_at)}
                                    {isOwnMessage && (
                                        <span className="text-[var(--theme-accent)]" title={message.is_read ? 'Read' : 'Delivered'}>
                                            {message.is_read ? '✓✓' : '✓'}
                                        </span>
                                    )}
                                    {!isOwnMessage && (() => {
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

export default MessageThread;
