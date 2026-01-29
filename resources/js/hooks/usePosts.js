import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { postsAPI } from '../services/api';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

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
    const user = useAuthStore((state) => state.user);

    return useMutation({
        mutationFn: (data) => postsAPI.createPost(data),
        onMutate: async (newPostData) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['posts', 'feed'] });
            await queryClient.cancelQueries({ queryKey: ['user-posts'] });

            // Snapshot previous values
            const previousFeed = queryClient.getQueryData(['posts', 'feed']);
            const previousUserPostsByUsername = queryClient.getQueryData(['user-posts', user?.username]);
            const previousUserPostsById = queryClient.getQueryData(['user-posts', user?.id]);

            // Create optimistic post object
            const optimisticPost = {
                id: `temp-${Date.now()}`,
                content: newPostData.get('content') || '',
                media_url: null, // Will be set when API responds
                media_type: null,
                visibility: newPostData.get('visibility') || 'public',
                user: {
                    id: user?.id,
                    name: user?.name,
                    username: user?.username,
                    profile_picture: user?.profile_picture,
                },
                likes_count: 0,
                comments_count: 0,
                is_liked: false,
                hashtags: [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            // Optimistically add post to feed
            queryClient.setQueryData(['posts', 'feed'], (old) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: [
                        {
                            ...old.pages[0],
                            data: {
                                ...old.pages[0].data,
                                posts: [optimisticPost, ...(old.pages[0].data.posts || [])],
                            },
                        },
                        ...old.pages.slice(1),
                    ],
                };
            });

            // Optimistically add post to user's own profile posts (using username as cache key)
            if (user?.username) {
                queryClient.setQueryData(['user-posts', user.username], (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        posts: [optimisticPost, ...(old.posts || [])],
                    };
                });
            }

            return { previousFeed, previousUserPostsByUsername, previousUserPostsById };
        },
        onSuccess: (response, variables, context) => {
            const newPost = response.data.post;

            // Update feed with real post data (replace optimistic post)
            queryClient.setQueryData(['posts', 'feed'], (old) => {
                if (!old) return old;
                const pages = old.pages.map((page, index) => {
                    if (index === 0) {
                        // Replace optimistic post with real post in first page
                        const posts = page.data.posts.map((post) =>
                            post.id?.toString().startsWith('temp-') ? newPost : post
                        );
                        // If optimistic post not found, add real post at the beginning
                        if (!posts.some((p) => p.id === newPost.id)) {
                            posts.unshift(newPost);
                        }
                        return {
                            ...page,
                            data: {
                                ...page.data,
                                posts,
                            },
                        };
                    }
                    return page;
                });
                return { ...old, pages };
            });

            // Update user's own profile posts with real post data
            if (user?.username) {
                queryClient.setQueryData(['user-posts', user.username], (old) => {
                    if (!old) return old;
                    const posts = old.posts.map((post) =>
                        post.id?.toString().startsWith('temp-') ? newPost : post
                    );
                    // If optimistic post not found, add real post at the beginning
                    if (!posts.some((p) => p.id === newPost.id)) {
                        posts.unshift(newPost);
                    }
                    return {
                        ...old,
                        posts,
                    };
                });
            }

            // Also invalidate to ensure everything is in sync
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            queryClient.invalidateQueries({ queryKey: ['user-posts'] });
            toast.success('Post created successfully!');
        },
        onError: (error, newPostData, context) => {
            // Rollback on error
            if (context?.previousFeed) {
                queryClient.setQueryData(['posts', 'feed'], context.previousFeed);
            }
            if (context?.previousUserPostsByUsername && user?.username) {
                queryClient.setQueryData(['user-posts', user.username], context.previousUserPostsByUsername);
            }
            if (context?.previousUserPostsById && user?.id) {
                queryClient.setQueryData(['user-posts', user.id], context.previousUserPostsById);
            }
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
