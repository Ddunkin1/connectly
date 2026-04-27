import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationsAPI } from '../services/api';
import toast from 'react-hot-toast';

export const useConversations = () => {
    return useInfiniteQuery({
        queryKey: ['conversations'],
        queryFn: ({ pageParam = 1 }) => conversationsAPI.getConversations(pageParam),
        getNextPageParam: (lastPage) => {
            const { pagination } = lastPage.data;
            return pagination.current_page < pagination.last_page
                ? pagination.current_page + 1
                : undefined;
        },
        initialPageParam: 1,
    });
};

export const useConversation = (conversationId) => {
    return useQuery({
        queryKey: ['conversation', conversationId],
        queryFn: () => conversationsAPI.getConversation(conversationId),
        enabled: !!conversationId,
        select: (data) => data.data,
    });
};

export const useConversationByUsername = (username) => {
    return useQuery({
        queryKey: ['conversation', 'username', username],
        queryFn: () => conversationsAPI.getConversationByUsername(username),
        enabled: !!username,
        select: (data) => data.data,
        retry: 1,
        retryDelay: 1000,
    });
};

export const useDeleteConversation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (conversationId) => conversationsAPI.deleteConversation(conversationId),
        onSuccess: (_, conversationId) => {
            // Remove immediately from cache so it disappears without waiting for refetch
            queryClient.setQueryData(['conversations'], (old) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map((page) => ({
                        ...page,
                        data: {
                            ...page.data,
                            conversations: (page.data?.conversations ?? []).filter(
                                (c) => c.id !== conversationId
                            ),
                        },
                    })),
                };
            });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            toast.success('Conversation deleted');
        },
        onError: () => {
            toast.error('Failed to delete conversation');
        },
    });
};
