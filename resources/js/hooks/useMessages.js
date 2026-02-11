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
    });
};

export const useSendMessage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => messagesAPI.sendMessage(data),
        onSuccess: (response, variables) => {
            // Invalidate conversations and messages cache
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            queryClient.invalidateQueries({ queryKey: ['messages'] });
            queryClient.invalidateQueries({ queryKey: ['conversation'] }); // Also invalidate single conversation queries
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
