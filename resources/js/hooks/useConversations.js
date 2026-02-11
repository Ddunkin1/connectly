import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { conversationsAPI } from '../services/api';

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
