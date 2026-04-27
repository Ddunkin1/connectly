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

const removeConversationFromCache = (old, conversationId) => {
    if (!old) return old;
    return {
        ...old,
        pages: old.pages.map((page) => ({
            ...page,
            data: {
                ...page.data,
                conversations: (page.data?.conversations ?? []).filter(
                    (c) => Number(c.id) !== Number(conversationId)
                ),
            },
        })),
    };
};

export const useDeleteConversation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (conversationId) => conversationsAPI.deleteConversation(conversationId),
        onMutate: async (conversationId) => {
            await queryClient.cancelQueries({ queryKey: ['conversations'] });
            const snapshot = queryClient.getQueryData(['conversations']);
            queryClient.setQueryData(['conversations'], (old) => removeConversationFromCache(old, conversationId));
            return { snapshot };
        },
        onSuccess: () => {
            toast.success('Conversation deleted');
        },
        onError: (_, __, context) => {
            if (context?.snapshot) {
                queryClient.setQueryData(['conversations'], context.snapshot);
            }
            toast.error('Failed to delete conversation');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        },
    });
};
