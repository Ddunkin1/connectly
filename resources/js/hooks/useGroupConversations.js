import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupConversationsAPI, groupMessagesAPI } from '../services/api';
import toast from 'react-hot-toast';

const patchGroupMessageInCache = (old, patchedMessage) => {
    if (!old?.data) return old;
    const existing = old.data.messages || [];
    return {
        ...old,
        data: {
            ...old.data,
            messages: existing.map((m) => (m.id === patchedMessage.id ? { ...m, ...patchedMessage } : m)),
        },
    };
};

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

export const useAddGroupMembers = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ groupId, memberIds }) => groupConversationsAPI.addMembers(groupId, memberIds),
        onSuccess: (response, { groupId }) => {
            queryClient.invalidateQueries({ queryKey: ['group-conversation', groupId] });
            queryClient.invalidateQueries({ queryKey: ['group-conversations'] });
            toast.success(response?.data?.message || 'Members added');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to add members');
        },
    });
};

export const useRemoveGroupMember = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ groupId, userId }) => groupConversationsAPI.removeMember(groupId, userId),
        onSuccess: (response, { groupId }) => {
            queryClient.invalidateQueries({ queryKey: ['group-conversation', groupId] });
            queryClient.invalidateQueries({ queryKey: ['group-conversations'] });
            toast.success(response?.data?.message || 'Member removed');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to remove member');
        },
    });
};

export const useSetGroupMemberNickname = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ groupId, userId, nickname }) => groupConversationsAPI.setNickname(groupId, userId, nickname),
        onSuccess: (response, { groupId }) => {
            queryClient.invalidateQueries({ queryKey: ['group-conversation', groupId] });
            queryClient.invalidateQueries({ queryKey: ['group-conversations'] });
            toast.success('Nickname updated');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update nickname');
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

export const useUpdateGroupMessage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ messageId, data }) => groupMessagesAPI.update(messageId, data),
        onSuccess: (response) => {
            const updated = response?.data?.data;
            const groupId = updated?.group_conversation_id;
            if (!updated || !groupId) return;

            queryClient.setQueryData(['group-conversation', groupId], (old) => patchGroupMessageInCache(old, updated));
            queryClient.invalidateQueries({ queryKey: ['group-conversations'] });
            toast.success('Message updated');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update message');
        },
    });
};

export const useDeleteGroupMessage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (messageId) => groupMessagesAPI.delete(messageId),
        onSuccess: (response) => {
            const deleted = response?.data?.data;
            const groupId = deleted?.group_conversation_id;
            if (!deleted || !groupId) return;

            queryClient.setQueryData(['group-conversation', groupId], (old) => patchGroupMessageInCache(old, deleted));
            queryClient.invalidateQueries({ queryKey: ['group-conversations'] });
            toast.success('Message deleted');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to delete message');
        },
    });
};
