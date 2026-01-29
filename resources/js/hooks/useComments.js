import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { commentsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { updatePostInCaches } from './usePosts';

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
            const postId = variables.postId;
            const commentsCount = response?.data?.comments_count;

            // Update post's comments_count everywhere so the number increments smoothly (no refetch = no flicker)
            if (typeof commentsCount === 'number') {
                updatePostInCaches(queryClient, postId, (post) => ({
                    ...post,
                    comments_count: commentsCount,
                }));
            } else {
                updatePostInCaches(queryClient, postId, (post) => ({
                    ...post,
                    comments_count: (post.comments_count ?? 0) + 1,
                }));
            }

            // Only refetch comments list so the new comment appears; don't invalidate post/posts/user-posts (we already updated counts)
            queryClient.invalidateQueries({ queryKey: ['comments', postId] });
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
