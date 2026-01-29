import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communityAPI } from '../services/api';
import toast from 'react-hot-toast';

export const useCommunities = (params = {}) => {
    return useQuery({
        queryKey: ['communities', params],
        queryFn: () => communityAPI.getAll(params),
        select: (data) => data.data,
    });
};

export const useCommunity = (id) => {
    return useQuery({
        queryKey: ['community', id],
        queryFn: () => communityAPI.getById(id),
        enabled: !!id,
        select: (data) => data.data,
    });
};

export const useCommunityPosts = (id, params = {}) => {
    return useQuery({
        queryKey: ['community-posts', id, params],
        queryFn: () => communityAPI.getPosts(id, params),
        enabled: !!id,
        select: (data) => data.data,
    });
};

export const useCreateCommunity = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => communityAPI.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['communities'] });
            toast.success('Community created successfully');
        },
        onError: (error) => {
            const message = error.response?.data?.message || 'Failed to create community';
            const errors = error.response?.data?.errors;
            if (errors) {
                Object.values(errors).flat().forEach((err) => toast.error(err));
            } else {
                toast.error(message);
            }
        },
    });
};

export const useUpdateCommunity = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => communityAPI.update(id, data),
        onSuccess: (response, variables) => {
            queryClient.invalidateQueries({ queryKey: ['communities'] });
            queryClient.invalidateQueries({ queryKey: ['community', variables.id] });
            toast.success('Community updated successfully');
        },
        onError: (error) => {
            const message = error.response?.data?.message || 'Failed to update community';
            const errors = error.response?.data?.errors;
            if (errors) {
                Object.values(errors).flat().forEach((err) => toast.error(err));
            } else {
                toast.error(message);
            }
        },
    });
};

export const useDeleteCommunity = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => communityAPI.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['communities'] });
            toast.success('Community deleted successfully');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to delete community');
        },
    });
};

export const useJoinCommunity = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => communityAPI.join(id),
        onSuccess: (response, id) => {
            queryClient.invalidateQueries({ queryKey: ['communities'] });
            queryClient.invalidateQueries({ queryKey: ['community', id] });
            toast.success('Successfully joined community');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to join community');
        },
    });
};

export const useLeaveCommunity = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => communityAPI.leave(id),
        onSuccess: (response, id) => {
            queryClient.invalidateQueries({ queryKey: ['communities'] });
            queryClient.invalidateQueries({ queryKey: ['community', id] });
            toast.success('Successfully left community');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to leave community');
        },
    });
};
