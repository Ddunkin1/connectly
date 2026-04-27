import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { storiesAPI } from '../services/api';
import toast from 'react-hot-toast';

export const useStories = () => {
    return useQuery({
        queryKey: ['stories'],
        queryFn: () => storiesAPI.getList(),
        select: (data) => data.data?.stories ?? [],
    });
};

export const useCreateStory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (formData) => storiesAPI.create(formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stories'] });
            toast.success('Story posted');
        },
        onError: (err) => {
            const msg = err?.response?.data?.message || err?.message || 'Failed to post story';
            toast.error(msg);
        },
    });
};

export const useStory = (storyId) => {
    return useQuery({
        queryKey: ['story', storyId],
        queryFn: () => storiesAPI.getOne(storyId),
        enabled: !!storyId,
        select: (data) => data.data?.story,
    });
};

export const useDeleteStory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (storyId) => storiesAPI.delete(storyId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stories'] });
            toast.success('Story deleted');
        },
        onError: () => toast.error('Failed to delete story'),
    });
};

export const useUpdateStory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ storyId, data }) => storiesAPI.update(storyId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stories'] });
            toast.success('Story updated');
        },
        onError: () => toast.error('Failed to update story'),
    });
};
