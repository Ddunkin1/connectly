import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userAPI, followAPI } from '../services/api';
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
        select: (data) => data.data,
    });
};

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => userAPI.updateProfile(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user'] });
            queryClient.invalidateQueries({ queryKey: ['profile'] });
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
            toast.success('Followed successfully');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to follow user');
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
            toast.success('Unfollowed successfully');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to unfollow user');
        },
    });
};
