import { useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { messagesAPI } from '../services/api';
import toast from 'react-hot-toast';

const patchMessageInInfiniteCache = (old, patchedMessage) => {
    if (!old?.pages?.length) return old;
    const pages = old.pages.map((page) => {
        const messages = page?.data?.messages || [];
        const nextMessages = messages.map((m) => (m.id === patchedMessage.id ? { ...m, ...patchedMessage } : m));
        return {
            ...page,
            data: {
                ...page.data,
                messages: nextMessages,
            },
        };
    });
    return { ...old, pages };
};

const PER_PAGE = 25;

export const useMessages = (conversationId) => {
    return useInfiniteQuery({
        queryKey: ['messages', conversationId],
        queryFn: ({ pageParam = 1 }) => messagesAPI.getMessages(conversationId, pageParam, PER_PAGE),
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
            const data = error.response?.data;
            const msg = data?.message
                || (data?.errors && typeof data.errors === 'object' && Object.values(data.errors).flat().length
                    ? Object.values(data.errors).flat().find(Boolean)
                    : null)
                || (error.code === 'ECONNABORTED' ? 'Upload took too long. Try a smaller file or check your connection.' : error.message)
                || 'Failed to send message';
            toast.error(msg);
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

export const useUpdateMessage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ messageId, data }) => messagesAPI.updateMessage(messageId, data),
        onSuccess: (response) => {
            const updatedMessage = response?.data?.data;
            const conversationId = updatedMessage?.conversation_id;
            if (!updatedMessage || !conversationId) return;

            queryClient.setQueryData(['messages', conversationId], (old) => patchMessageInInfiniteCache(old, updatedMessage));
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            toast.success('Message updated');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update message');
        },
    });
};

export const useDeleteMessage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (messageId) => messagesAPI.deleteMessage(messageId),
        onSuccess: (response) => {
            const deletedMessage = response?.data?.data;
            const conversationId = deletedMessage?.conversation_id;
            if (!deletedMessage || !conversationId) return;

            queryClient.setQueryData(['messages', conversationId], (old) => patchMessageInInfiniteCache(old, deletedMessage));
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            toast.success('Message deleted');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to delete message');
        },
    });
};

export const usePinMessage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (messageId) => messagesAPI.pinMessage(messageId),
        onSuccess: (response) => {
            const updatedMessage = response?.data?.data;
            const conversationId = updatedMessage?.conversation_id;
            if (!updatedMessage || !conversationId) return;

            queryClient.setQueryData(['messages', conversationId], (old) => patchMessageInInfiniteCache(old, updatedMessage));
            toast.success('Message pinned');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to pin message');
        },
    });
};

export const useUnpinMessage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (messageId) => messagesAPI.unpinMessage(messageId),
        onSuccess: (response) => {
            const updatedMessage = response?.data?.data;
            const conversationId = updatedMessage?.conversation_id;
            if (!updatedMessage || !conversationId) return;

            queryClient.setQueryData(['messages', conversationId], (old) => patchMessageInInfiniteCache(old, updatedMessage));
            toast.success('Message unpinned');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to unpin message');
        },
    });
};
