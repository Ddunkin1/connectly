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
            queryClient.invalidateQueries({ queryKey: ['user-posts'] });
            queryClient.invalidateQueries({ queryKey: ['suggested-users'] });
            queryClient.refetchQueries({ queryKey: ['friend-requests'] });
            queryClient.refetchQueries({ queryKey: ['profile'] });
            queryClient.refetchQueries({ queryKey: ['user-posts'] });
            queryClient.refetchQueries({ queryKey: ['suggested-users'] });
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
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            queryClient.invalidateQueries({ queryKey: ['user'] });
            queryClient.invalidateQueries({ queryKey: ['user-posts'] });
            queryClient.invalidateQueries({ queryKey: ['suggested-users'] });
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
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            queryClient.invalidateQueries({ queryKey: ['user-posts'] });
            queryClient.invalidateQueries({ queryKey: ['suggested-users'] });
            toast.success('Friend request declined');
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
        onMutate: async (friendRequestId) => {
            await queryClient.cancelQueries({ queryKey: ['profile'] });
            await queryClient.cancelQueries({ queryKey: ['friend-requests'] });

            const previousFriendRequests = queryClient.getQueryData(['friend-requests']);
            const previousProfiles = queryClient.getQueriesData({ queryKey: ['profile'] });

            const friendRequests = previousFriendRequests;
            const request = friendRequests?.sent?.find((req) => String(req.id) === String(friendRequestId));
            const receiverId = request?.receiver?.id;

            if (friendRequests?.sent && request) {
                queryClient.setQueryData(['friend-requests'], {
                    ...friendRequests,
                    sent: friendRequests.sent.filter((req) => req.id !== friendRequestId),
                });
            }

            if (receiverId != null) {
                queryClient.setQueriesData({ queryKey: ['profile'] }, (data) => {
                    if (!data || data.id !== receiverId) return data;
                    return { ...data, friend_request_status: null };
                });
            }

            return { previousFriendRequests, previousProfiles };
        },
        onError: (error, friendRequestId, context) => {
            if (context?.previousFriendRequests != null) {
                queryClient.setQueryData(['friend-requests'], context.previousFriendRequests);
            }
            if (context?.previousProfiles) {
                context.previousProfiles.forEach(([key, data]) => queryClient.setQueryData(key, data));
            }
            toast.error(error.response?.data?.message || 'Failed to cancel friend request');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            queryClient.invalidateQueries({ queryKey: ['user-posts'] });
            queryClient.invalidateQueries({ queryKey: ['suggested-users'] });
            queryClient.refetchQueries({ queryKey: ['friend-requests'] });
            queryClient.refetchQueries({ queryKey: ['profile'] });
            queryClient.refetchQueries({ queryKey: ['user-posts'] });
            queryClient.refetchQueries({ queryKey: ['suggested-users'] });
            toast.success('Friend request cancelled');
        },
    });
};
