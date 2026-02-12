import React, { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useMessages } from '../../hooks/useMessages';
import { getEcho } from '../../echo';
import LoadingSpinner from '../common/LoadingSpinner';
import { formatDate } from '../../utils/formatDate';
import useAuthStore from '../../store/authStore';

const formatDateSeparator = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'TODAY';
    if (d.toDateString() === yesterday.toDateString()) return 'YESTERDAY';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
};

const MessageThread = ({ conversationId, onMediaFromMessages }) => {
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

    // Extract media for right panel
    useEffect(() => {
        if (onMediaFromMessages) {
            const media = messages.filter((m) => m.attachment_url).map((m) => ({
                id: m.id,
                attachment_url: m.attachment_url,
                attachment_type: m.attachment_type || 'image',
            }));
            onMediaFromMessages(media);
        }
    }, [messages, onMediaFromMessages]);

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

    // Group messages by date for separators
    const grouped = [];
    let lastDateKey = null;
    messages.forEach((msg) => {
        const dateKey = msg.created_at ? new Date(msg.created_at).toDateString() : '';
        if (dateKey && dateKey !== lastDateKey) {
            grouped.push({ type: 'separator', date: msg.created_at });
            lastDateKey = dateKey;
        }
        grouped.push({ type: 'message', data: msg });
    });

    return (
        <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 min-h-0 overflow-y-auto px-6 py-6 flex flex-col gap-6 custom-scrollbar"
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
                grouped.map((item, idx) => {
                    if (item.type === 'separator') {
                        return (
                            <div key={`sep-${idx}`} className="flex flex-col items-center mb-4">
                                <span className="px-3 py-1 bg-[var(--theme-surface-hover)] text-[10px] font-bold text-slate-500 rounded-full uppercase tracking-tighter">
                                    {formatDateSeparator(item.date)}
                                </span>
                            </div>
                        );
                    }
                    const message = item.data;
                    const isOwnMessage = message.sender?.id === user?.id;
                    return (
                        <div key={message.id} className={`flex items-end gap-3 max-w-[85%] ${isOwnMessage ? 'self-end flex-row-reverse' : ''}`}>
                            {!isOwnMessage && (
                                <img src={message.sender?.profile_picture} alt={message.sender?.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                            )}
                            <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                                <div className={`p-4 rounded-2xl shadow-sm ${
                                    isOwnMessage ? 'message-gradient text-white rounded-br-none shadow-lg shadow-primary/20' : 'bg-[var(--theme-surface-hover)] text-white border border-[var(--theme-border)] rounded-bl-none'
                                }`}>
                                    {message.attachment_url && (
                                        <div className="mb-2">
                                            {message.attachment_type === 'video' ? (
                                                <video src={message.attachment_url} controls className="rounded-lg max-w-full max-h-64" />
                                            ) : (
                                                <a href={message.attachment_url} target="_blank" rel="noopener noreferrer">
                                                    <img src={message.attachment_url} alt="Shared media" className="rounded-lg max-w-full max-h-64 object-cover" />
                                                </a>
                                            )}
                                        </div>
                                    )}
                                    {message.message && <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.message}</p>}
                                </div>
                                <span className={`text-[10px] mt-2 block ${isOwnMessage ? 'text-white/70 text-right' : 'text-slate-400'}`}>{formatDate(message.created_at)}</span>
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
