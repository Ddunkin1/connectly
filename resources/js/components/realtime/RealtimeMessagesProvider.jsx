import React, { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getEcho } from '../../echo';
import useAuthStore from '../../store/authStore';

function getUserIdFromStorage() {
    try {
        const raw = localStorage.getItem('auth-storage');
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed?.state?.user?.id ?? null;
    } catch {
        return null;
    }
}

/**
 * Subscribes to the current user's private channel so they receive new messages
 * and notifications in real-time anywhere in the app.
 */
export default function RealtimeMessagesProvider({ children }) {
    const queryClient = useQueryClient();
    const user = useAuthStore((state) => state.user);
    const userId = user?.id ?? getUserIdFromStorage();

    useEffect(() => {
        if (!userId) return;

        const echo = getEcho();
        if (!echo) return;

        const channelName = `App.Models.User.${userId}`;
        const channel = echo.private(channelName);

        // Listen for Laravel broadcast notifications (likes, comments, shares, friend requests, etc.)
        channel.notification((notification) => {
            const norm = {
                id: notification.id || `broadcast-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                type: notification.type ?? notification.data?.type ?? 'unknown',
                data: notification.data ?? notification,
                read_at: null,
                created_at: notification.created_at ?? new Date().toISOString(),
            };

            queryClient.setQueryData(['notifications'], (old) => {
                const prev = old?.data ?? old;
                const notifications = Array.isArray(prev?.notifications) ? prev.notifications : [];
                const exists = notifications.some((n) => n.id === norm.id);
                if (exists) return old;
                const updated = {
                    notifications: [norm, ...notifications],
                    unread_count: (prev?.unread_count ?? 0) + 1,
                };
                return old?.data !== undefined
                    ? { ...old, data: { ...old.data, ...updated } }
                    : { data: updated };
            });

            queryClient.setQueryData(['notifications', 'unread-count'], (old) => {
                const count = ((old?.data?.unread_count ?? 0) + 1);
                return { ...old, data: { unread_count: count } };
            });
        });

        channel.listen('.MessageReceived', (payload) => {
            const newMessage = payload?.message;
            const conversationId = payload?.conversation_id;
            if (!newMessage || !conversationId) return;

            const currentUser = useAuthStore.getState().user;
            if (newMessage.sender?.id === currentUser?.id) return; // Skip own messages

            // Add message to the conversation's messages cache (or invalidate if not loaded yet)
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

            // Update conversations cache: increment unread, update last_message, move to top
            let foundConversation = false;
            queryClient.setQueryData(['conversations'], (old) => {
                if (!old?.pages?.length) return old;
                const updatedPages = old.pages.map((page) => {
                    const convos = page.data?.conversations || [];
                    const idx = convos.findIndex((c) => c.id === conversationId);
                    if (idx === -1) return page;
                    foundConversation = true;
                    const updated = convos.map((c) => {
                        if (c.id !== conversationId) return c;
                        return {
                            ...c,
                            unread_count: (c.unread_count || 0) + 1,
                            last_message: newMessage,
                            last_message_at: newMessage.created_at,
                        };
                    });
                    const [moved] = updated.splice(idx, 1);
                    updated.unshift(moved);
                    return {
                        ...page,
                        data: {
                            ...page.data,
                            conversations: updated,
                        },
                    };
                });
                return { ...old, pages: updatedPages };
            });

            // New conversation not in cache - refetch to get it
            if (!foundConversation) {
                queryClient.invalidateQueries({ queryKey: ['conversations'] });
            }
        });

        return () => {
            channel.stopListening('.MessageReceived');
            echo.leave(channelName);
        };
    }, [userId, queryClient]);

    return children;
}
