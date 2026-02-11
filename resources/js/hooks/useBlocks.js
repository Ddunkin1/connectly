import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blocksAPI } from '../services/api';
import toast from 'react-hot-toast';

export const useBlockedUsers = (page = 1) => {
    return useQuery({
        queryKey: ['blocked-users', page],
        queryFn: () => blocksAPI.getBlockedUsers(page),
        select: (data) => {
            const body = data.data;
            return {
                blocked_users: body?.blocked_users || [],
                pagination: body?.pagination || {},
            };
        },
    });
};

export const useBlockUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userId) => blocksAPI.blockUser(userId),
        onSuccess: (_, userId) => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
            queryClient.invalidateQueries({ queryKey: ['user'] });
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            toast.success('User blocked successfully');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to block user');
        },
    });
};

export const useUnblockUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userId) => blocksAPI.unblockUser(userId),
        onSuccess: (_, userId) => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
            queryClient.invalidateQueries({ queryKey: ['user'] });
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            toast.success('User unblocked successfully');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to unblock user');
        },
    });
};
