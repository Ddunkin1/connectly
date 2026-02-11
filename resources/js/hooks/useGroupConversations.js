import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupConversationsAPI, groupMessagesAPI } from '../services/api';
import toast from 'react-hot-toast';

export const useGroupConversations = () => {
    return useInfiniteQuery({
        queryKey: ['group-conversations'],
        queryFn: ({ pageParam = 1 }) => groupConversationsAPI.getList(pageParam),
        getNextPageParam: (lastPage) => {
            const { pagination } = lastPage.data;
            return pagination.current_page < pagination.last_page
                ? pagination.current_page + 1
                : undefined;
        },
        initialPageParam: 1,
    });
};

export const useGroupConversationWithMessages = (id) => {
    return useQuery({
        queryKey: ['group-conversation', id],
        queryFn: () => groupConversationsAPI.getOne(id),
        enabled: !!id,
        select: (data) => data.data,
    });
};

export const useCreateGroupConversation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => groupConversationsAPI.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['group-conversations'] });
            toast.success('Group created');
        },
        onError: (error) => {
            const message = error.response?.data?.message || 'Failed to create group';
            const errors = error.response?.data?.errors;
            if (errors) {
                Object.values(errors).flat().forEach((err) => toast.error(err));
            } else {
                toast.error(message);
            }
        },
    });
};

export const useSendGroupMessage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => groupMessagesAPI.send(data),
        onSuccess: (response, variables) => {
            const groupId = variables.group_conversation_id;
            const messageData = response?.data?.message;

            if (groupId && messageData) {
                queryClient.setQueryData(['group-conversation', groupId], (old) => {
                    if (!old?.data) return old;
                    const existing = old.data.messages || [];
                    const exists = existing.some((m) => m.id === messageData.id);
                    if (exists) return old;
                    return {
                        ...old,
                        data: {
                            ...old.data,
                            messages: [...existing, messageData],
                        },
                    };
                });
            }

            queryClient.invalidateQueries({ queryKey: ['group-conversations'] });
            toast.success('Message sent');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to send message');
        },
    });
};
