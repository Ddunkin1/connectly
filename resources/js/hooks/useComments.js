import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { commentsAPI } from '../services/api';
import toast from 'react-hot-toast';

export const useComments = (postId) => {
    return useQuery({
        queryKey: ['comments', postId],
        queryFn: () => commentsAPI.getComments(postId),
        enabled: !!postId,
        select: (data) => data.data.comments,
    });
};

export const useCreateComment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ postId, data }) => commentsAPI.createComment(postId, data),
        onSuccess: (response, variables) => {
            queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] });
            queryClient.invalidateQueries({ queryKey: ['post', variables.postId] });
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            toast.success('Comment added successfully');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to add comment');
        },
    });
};

export const useDeleteComment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (commentId) => commentsAPI.deleteComment(commentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments'] });
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            toast.success('Comment deleted successfully');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to delete comment');
        },
    });
};
