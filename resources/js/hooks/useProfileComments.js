import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileCommentsAPI } from '../services/api';
import toast from 'react-hot-toast';

export function useProfileComments(userId) {
    return useQuery({
        queryKey: ['profile-comments', userId],
        queryFn: () => profileCommentsAPI.getComments(userId),
        enabled: !!userId,
        select: (data) => data.data?.comments ?? [],
    });
}

export function useCreateProfileComment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, data }) => profileCommentsAPI.createComment(userId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['profile-comments', variables.userId] });
            toast.success('Comment added');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to add comment');
        },
    });
}

export function useUpdateProfileComment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ commentId, data }) => profileCommentsAPI.updateComment(commentId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['profile-comments'] });
            toast.success('Comment updated');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update comment');
        },
    });
}

export function useHideProfileComment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (commentId) => profileCommentsAPI.hideComment(commentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile-comments'] });
            toast.success('Comment hidden');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to hide comment');
        },
    });
}

export function useUnhideProfileComment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (commentId) => profileCommentsAPI.unhideComment(commentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile-comments'] });
            toast.success('Comment unhidden');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to unhide comment');
        },
    });
}

export function useDeleteProfileComment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (commentId) => profileCommentsAPI.deleteComment(commentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile-comments'] });
            toast.success('Comment deleted');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to delete comment');
        },
    });
}
