import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userAPI, followAPI, friendRequestAPI } from '../services/api';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

export const useUserProfile = (userId) => {
    return useQuery({
        queryKey: ['profile', userId],
        queryFn: () => userAPI.getProfile(userId),
        enabled: !!userId,
        select: (data) => ({
            ...data.data.user,
            followers_preview: data.data.followers_preview ?? [],
        }),
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

export const useUserCommunities = (userId) => {
    return useQuery({
        queryKey: ['user-communities', userId],
        queryFn: () => userAPI.getUserCommunities(userId),
        enabled: !!userId,
        select: (response) => {
            const raw = response.data?.communities;
            return Array.isArray(raw) ? raw : (raw?.data ?? []);
        },
    });
};

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => userAPI.updateProfile(data),
        onSuccess: async (response) => {
            const userData = response?.data?.user;
            const message = response?.data?.message || 'Profile updated successfully';

            if (userData) {
                useAuthStore.getState().updateUser(userData);
            }
            queryClient.invalidateQueries({ queryKey: ['user'] });
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            queryClient.invalidateQueries({ queryKey: ['profile-picture-history'] });
            queryClient.invalidateQueries({ queryKey: ['cover-image-history'] });
            await Promise.all([
                queryClient.refetchQueries({ queryKey: ['user'] }),
                queryClient.refetchQueries({ queryKey: ['profile'] }),
            ]);

            toast.success(message);
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
        onMutate: async (userId) => {
            await queryClient.cancelQueries({ queryKey: ['profile'] });
            await queryClient.cancelQueries({ queryKey: ['friend-requests'] });

            const previousProfiles = queryClient.getQueriesData({ queryKey: ['profile'] });
            const previousFriendRequests = queryClient.getQueryData(['friend-requests']);

            const profileEntries = queryClient.getQueriesData({ queryKey: ['profile'] });
            const profileForReceiver = profileEntries.find(([, data]) => data?.id === userId)?.[1];

            queryClient.setQueriesData({ queryKey: ['profile'] }, (data) => {
                if (!data || data.id !== userId) return data;
                return { ...data, friend_request_status: 'sent' };
            });

            const friendRequests = queryClient.getQueryData(['friend-requests']);
            if (friendRequests?.sent && profileForReceiver) {
                queryClient.setQueryData(['friend-requests'], {
                    ...friendRequests,
                    sent: [
                        ...friendRequests.sent,
                        {
                            id: `temp-${Date.now()}`,
                            receiver: { id: userId, username: profileForReceiver.username, name: profileForReceiver.name },
                            status: 'pending',
                        },
                    ],
                });
            }

            return { previousProfiles, previousFriendRequests };
        },
        onError: (error, userId, context) => {
            const message = error.response?.data?.message || 'Failed to send friend request';

            // When already friends: update UI immediately to show Connected + Unfollow
            if (message.includes('already friends')) {
                queryClient.setQueriesData({ queryKey: ['profile'] }, (data) => {
                    if (!data || data.id !== userId) return data;
                    return { ...data, is_following: true, friend_request_status: null };
                });
                queryClient.invalidateQueries({ queryKey: ['profile'] });
                queryClient.invalidateQueries({ queryKey: ['suggested-users'] });
                queryClient.refetchQueries({ queryKey: ['profile'] });
                queryClient.refetchQueries({ queryKey: ['suggested-users'] });
            } else if (message.includes('already sent')) {
                // Already sent: refetch to show Request Sent state
                queryClient.invalidateQueries({ queryKey: ['profile'] });
                queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
                queryClient.refetchQueries({ queryKey: ['profile'] });
                queryClient.refetchQueries({ queryKey: ['friend-requests'] });
            } else {
                // Other errors: rollback optimistic update
                if (context?.previousProfiles) {
                    context.previousProfiles.forEach(([key, data]) => queryClient.setQueryData(key, data));
                }
                if (context?.previousFriendRequests != null) {
                    queryClient.setQueryData(['friend-requests'], context.previousFriendRequests);
                }
            }

            toast.error(message);
        },
        onSuccess: (response, userId) => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            queryClient.invalidateQueries({ queryKey: ['user'] });
            queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            queryClient.invalidateQueries({ queryKey: ['user-posts'] });
            queryClient.invalidateQueries({ queryKey: ['suggested-users'] });
            queryClient.refetchQueries({ queryKey: ['profile'] });
            queryClient.refetchQueries({ queryKey: ['user'] });
            queryClient.refetchQueries({ queryKey: ['friend-requests'] });
            queryClient.refetchQueries({ queryKey: ['posts'] });
            queryClient.refetchQueries({ queryKey: ['user-posts'] });
            queryClient.refetchQueries({ queryKey: ['suggested-users'] });
            toast.success('Friend request sent successfully');
        },
    });
};

export const useUnfollow = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userId) => followAPI.unfollow(userId),
        onSuccess: (response, userId) => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            queryClient.invalidateQueries({ queryKey: ['user'] });
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            queryClient.invalidateQueries({ queryKey: ['user-posts'] });
            queryClient.invalidateQueries({ queryKey: ['suggested-users'] });
            queryClient.refetchQueries({ queryKey: ['profile'] });
            queryClient.refetchQueries({ queryKey: ['user'] });
            queryClient.refetchQueries({ queryKey: ['posts'] });
            queryClient.refetchQueries({ queryKey: ['user-posts'] });
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

export const useProfilePictureHistory = (enabled) => {
    return useQuery({
        queryKey: ['profile-picture-history'],
        queryFn: () => userAPI.getProfilePictureHistory(),
        enabled: !!enabled,
        select: (data) => data.data?.items ?? [],
    });
};

export const useCoverImageHistory = (enabled) => {
    return useQuery({
        queryKey: ['cover-image-history'],
        queryFn: () => userAPI.getCoverImageHistory(),
        enabled: !!enabled,
        select: (data) => data.data?.items ?? [],
    });
};
