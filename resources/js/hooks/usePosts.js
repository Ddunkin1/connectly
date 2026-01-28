import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { postsAPI } from '../services/api';
import toast from 'react-hot-toast';

export const useFeed = () => {
    return useInfiniteQuery({
        queryKey: ['posts', 'feed'],
        queryFn: ({ pageParam = 1 }) => postsAPI.getFeed(pageParam),
        getNextPageParam: (lastPage) => {
            const { pagination } = lastPage.data;
            return pagination.current_page < pagination.last_page
                ? pagination.current_page + 1
                : undefined;
        },
        initialPageParam: 1,
    });
};

export const usePost = (postId) => {
    return useQuery({
        queryKey: ['post', postId],
        queryFn: () => postsAPI.getPost(postId),
        enabled: !!postId,
        select: (data) => data.data.post,
    });
};

export const useCreatePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => postsAPI.createPost(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            toast.success('Post created successfully!');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to create post');
        },
    });
};

export const useUpdatePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ postId, data }) => postsAPI.updatePost(postId, data),
        onSuccess: (response, variables) => {
            queryClient.invalidateQueries({ queryKey: ['post', variables.postId] });
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            toast.success('Post updated successfully!');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update post');
        },
    });
};

export const useDeletePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (postId) => postsAPI.deletePost(postId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            toast.success('Post deleted successfully!');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to delete post');
        },
    });
};

export const useLikePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (postId) => postsAPI.likePost(postId),
        onMutate: async (postId) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['post', postId] });
            await queryClient.cancelQueries({ queryKey: ['posts'] });

            // Snapshot previous value
            const previousPost = queryClient.getQueryData(['post', postId]);
            const previousPosts = queryClient.getQueryData(['posts']);

            // Optimistically update
            queryClient.setQueryData(['post', postId], (old) => {
                if (!old) return old;
                return {
                    ...old,
                    data: {
                        ...old.data,
                        post: {
                            ...old.data.post,
                            is_liked: true,
                            likes_count: (old.data.post.likes_count || 0) + 1,
                        },
                    },
                };
            });

            return { previousPost, previousPosts };
        },
        onError: (err, postId, context) => {
            // Rollback on error
            if (context?.previousPost) {
                queryClient.setQueryData(['post', postId], context.previousPost);
            }
            if (context?.previousPosts) {
                queryClient.setQueryData(['posts'], context.previousPosts);
            }
            toast.error('Failed to like post');
        },
        onSettled: (postId) => {
            queryClient.invalidateQueries({ queryKey: ['post', postId] });
            queryClient.invalidateQueries({ queryKey: ['posts'] });
        },
    });
};

export const useUnlikePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (postId) => postsAPI.unlikePost(postId),
        onMutate: async (postId) => {
            await queryClient.cancelQueries({ queryKey: ['post', postId] });
            await queryClient.cancelQueries({ queryKey: ['posts'] });

            const previousPost = queryClient.getQueryData(['post', postId]);
            const previousPosts = queryClient.getQueryData(['posts']);

            queryClient.setQueryData(['post', postId], (old) => {
                if (!old) return old;
                return {
                    ...old,
                    data: {
                        ...old.data,
                        post: {
                            ...old.data.post,
                            is_liked: false,
                            likes_count: Math.max(0, (old.data.post.likes_count || 0) - 1),
                        },
                    },
                };
            });

            return { previousPost, previousPosts };
        },
        onError: (err, postId, context) => {
            if (context?.previousPost) {
                queryClient.setQueryData(['post', postId], context.previousPost);
            }
            if (context?.previousPosts) {
                queryClient.setQueryData(['posts'], context.previousPosts);
            }
            toast.error('Failed to unlike post');
        },
        onSettled: (postId) => {
            queryClient.invalidateQueries({ queryKey: ['post', postId] });
            queryClient.invalidateQueries({ queryKey: ['posts'] });
        },
    });
};
