import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { friendRequestAPI } from '../services/api';
import toast from 'react-hot-toast';

export const useFriendRequests = () => {
    return useQuery({
        queryKey: ['friend-requests'],
        queryFn: () => friendRequestAPI.getFriendRequests(),
        select: (data) => data.data,
    });
};

export const useSendFriendRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userId) => friendRequestAPI.sendFriendRequest(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            toast.success('Friend request sent successfully');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to send friend request');
        },
    });
};

export const useAcceptFriendRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (friendRequestId) => friendRequestAPI.acceptFriendRequest(friendRequestId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            queryClient.invalidateQueries({ queryKey: ['user'] });
            toast.success('Friend request accepted');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to accept friend request');
        },
    });
};

export const useRejectFriendRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (friendRequestId) => friendRequestAPI.rejectFriendRequest(friendRequestId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            toast.success('Friend request rejected');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to reject friend request');
        },
    });
};

export const useCancelFriendRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (friendRequestId) => friendRequestAPI.cancelFriendRequest(friendRequestId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            toast.success('Friend request cancelled');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to cancel friend request');
        },
    });
};
