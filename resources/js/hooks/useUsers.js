import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userAPI, followAPI, friendRequestAPI } from '../services/api';
import toast from 'react-hot-toast';

export const useUserProfile = (userId) => {
    return useQuery({
        queryKey: ['profile', userId],
        queryFn: () => userAPI.getProfile(userId),
        enabled: !!userId,
        select: (data) => data.data.user,
    });
};

export const useUserPosts = (userId) => {
    return useQuery({
        queryKey: ['user-posts', userId],
        queryFn: () => userAPI.getUserPosts(userId),
        enabled: !!userId,
        // API may return { posts: [...] } or { posts: { data: [...] } } (Laravel resource collection)
        select: (response) => {
            const body = response.data;
            const rawPosts = body?.posts;
            const posts = Array.isArray(rawPosts)
                ? rawPosts
                : (Array.isArray(rawPosts?.data) ? rawPosts.data : []);
            const pagination = body?.pagination ?? {};
            return { posts, pagination };
        },
    });
};

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => userAPI.updateProfile(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user'] });
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            queryClient.refetchQueries({ queryKey: ['user'] });
            queryClient.refetchQueries({ queryKey: ['profile'] });
            toast.success('Profile updated successfully');
        },
        onError: (error) => {
            const message = error.response?.data?.message || 'Failed to update profile';
            const errors = error.response?.data?.errors;
            if (errors) {
                Object.values(errors).flat().forEach((err) => toast.error(err));
            } else {
                toast.error(message);
            }
        },
    });
};

export const useFollow = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userId) => followAPI.follow(userId),
        onSuccess: (response, userId) => {
            queryClient.invalidateQueries({ queryKey: ['profile', userId] });
            queryClient.invalidateQueries({ queryKey: ['user'] });
            queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            queryClient.invalidateQueries({ queryKey: ['suggested-users'] });
            queryClient.refetchQueries({ queryKey: ['profile', userId] });
            queryClient.refetchQueries({ queryKey: ['user'] });
            queryClient.refetchQueries({ queryKey: ['friend-requests'] });
            queryClient.refetchQueries({ queryKey: ['posts'] });
            queryClient.refetchQueries({ queryKey: ['suggested-users'] });
            toast.success('Friend request sent successfully');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to send friend request');
        },
    });
};

export const useUnfollow = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userId) => followAPI.unfollow(userId),
        onSuccess: (response, userId) => {
            queryClient.invalidateQueries({ queryKey: ['profile', userId] });
            queryClient.invalidateQueries({ queryKey: ['user'] });
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            queryClient.invalidateQueries({ queryKey: ['suggested-users'] });
            queryClient.refetchQueries({ queryKey: ['profile', userId] });
            queryClient.refetchQueries({ queryKey: ['user'] });
            queryClient.refetchQueries({ queryKey: ['posts'] });
            queryClient.refetchQueries({ queryKey: ['suggested-users'] });
            toast.success('Unfollowed successfully');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to unfollow user');
        },
    });
};

export const useSuggestedUsers = () => {
    return useQuery({
        queryKey: ['suggested-users'],
        queryFn: () => userAPI.getSuggested(),
        select: (data) => data.data.users,
    });
};
