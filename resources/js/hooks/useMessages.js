import { useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { messagesAPI } from '../services/api';
import toast from 'react-hot-toast';

export const useMessages = (conversationId) => {
    return useInfiniteQuery({
        queryKey: ['messages', conversationId],
        queryFn: ({ pageParam = 1 }) => messagesAPI.getMessages(conversationId, pageParam),
        enabled: !!conversationId,
        getNextPageParam: (lastPage) => {
            const { pagination } = lastPage.data;
            return pagination.current_page < pagination.last_page
                ? pagination.current_page + 1
                : undefined;
        },
        initialPageParam: 1,
        retry: 1,
        retryDelay: 1000,
        // Fallback: poll every 15s when viewing conversation (in case WebSocket fails)
        refetchInterval: 15000,
        refetchIntervalInBackground: false,
    });
};

export const useSendMessage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => messagesAPI.sendMessage(data),
        onSuccess: (response, variables) => {
            const messageData = response?.data?.data;
            const conversationId = messageData?.conversation_id;

            // Optimistically add the message to cache (avoids refetch, instant UI update)
            if (conversationId && messageData) {
                queryClient.setQueryData(['messages', conversationId], (old) => {
                    if (!old?.pages?.length) return old;
                    const pages = [...old.pages];
                    const firstPage = pages[0];
                    if (firstPage?.data?.messages) {
                        // Avoid duplicate if already added via real-time
                        const exists = firstPage.data.messages.some((m) => m.id === messageData.id);
                        if (!exists) {
                            pages[0] = {
                                ...firstPage,
                                data: {
                                    ...firstPage.data,
                                    messages: [messageData, ...firstPage.data.messages],
                                },
                            };
                        }
                    }
                    return { ...old, pages };
                });
            }

            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            queryClient.invalidateQueries({ queryKey: ['conversation'] });
            toast.success('Message sent successfully!');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to send message');
        },
    });
};

export const useMarkAsRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (conversationId) => messagesAPI.markAsRead(conversationId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            queryClient.invalidateQueries({ queryKey: ['messages'] });
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to mark as read');
        },
    });
};
