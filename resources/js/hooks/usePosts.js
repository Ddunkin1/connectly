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
                shares_count: 0,
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
                    // Handle first time (no cache yet) or empty cache
                    const existingPosts = old?.posts ?? [];
                    const base = old ?? {
                        posts: [],
                        pagination: { current_page: 1, last_page: 1, per_page: 15, total: 0 },
                    };
                    return {
                        ...base,
                        posts: [optimisticPost, ...existingPosts],
                        pagination: base.pagination
                            ? { ...base.pagination, total: (base.pagination.total ?? 0) + 1 }
                            : base.pagination,
                    };
                });
            }

            return { previousFeed, previousUserPostsByUsername, previousUserPostsById };
        },
        onSuccess: (response, variables, context) => {
            const newPost = response?.data?.post;
            if (!newPost) {
                // Fallback: just invalidate so refetch gets latest
                queryClient.invalidateQueries({ queryKey: ['posts'] });
                queryClient.invalidateQueries({ queryKey: ['user-posts'] });
                toast.success('Post created successfully!');
                return;
            }

            // Update feed with real post data (replace optimistic post)
            queryClient.setQueryData(['posts', 'feed'], (old) => {
                if (!old) return old;
                const pages = old.pages.map((page, index) => {
                    if (index === 0) {
                        const existing = page.data?.posts ?? [];
                        const posts = existing.map((post) =>
                            post.id?.toString().startsWith('temp-') ? newPost : post
                        );
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
                    const existing = old?.posts ?? [];
                    const posts = existing.map((post) =>
                        post.id?.toString().startsWith('temp-') ? newPost : post
                    );
                    if (!posts.some((p) => p.id === newPost.id)) {
                        posts.unshift(newPost);
                    }
                    const base = old ?? {
                        pagination: { current_page: 1, last_page: 1, per_page: 15, total: 0 },
                    };
                    return {
                        ...base,
                        posts,
                        pagination: base.pagination
                            ? { ...base.pagination, total: Math.max(posts.length, base.pagination.total ?? 0) }
                            : base.pagination,
                    };
                });
            }

            // Invalidate and explicitly refetch current user's profile posts so timeline updates
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            queryClient.invalidateQueries({ queryKey: ['user-posts'] });
            if (user?.username) {
                queryClient.refetchQueries({ queryKey: ['user-posts', user.username] });
            }
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
            queryClient.invalidateQueries({ queryKey: ['user-posts'] });
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
            queryClient.invalidateQueries({ queryKey: ['user-posts'] });
            toast.success('Post deleted successfully!');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to delete post');
        },
    });
};

// Export so useComments can update post counts when a comment is added
export function updatePostInCaches(queryClient, postId, updater) {
    // Single post
    queryClient.setQueryData(['post', postId], (old) => {
        if (!old?.data?.post) return old;
        return {
            ...old,
            data: {
                ...old.data,
                post: updater(old.data.post),
            },
        };
    });

    // Feed (infinite query: pages[].data.posts or pages[].data.posts.data)
    queryClient.setQueryData(['posts', 'feed'], (old) => {
        if (!old?.pages) return old;
        return {
            ...old,
            pages: old.pages.map((page) => {
                const raw = page.data?.posts;
                const list = Array.isArray(raw) ? raw : raw?.data ?? [];
                const updated = list.map((p) => (String(p?.id) === String(postId) ? updater(p) : p));
                return {
                    ...page,
                    data: {
                        ...page.data,
                        posts: Array.isArray(raw) ? updated : { ...raw, data: updated },
                    },
                };
            }),
        };
    });

    // All user-posts caches (profile timelines)
    const userPostsEntries = queryClient.getQueriesData({ queryKey: ['user-posts'] });
    userPostsEntries.forEach(([queryKey, data]) => {
        if (!data?.posts) return;
        const updated = data.posts.map((p) => (String(p?.id) === String(postId) ? updater(p) : p));
        queryClient.setQueryData(queryKey, { ...data, posts: updated });
    });
}

export const useLikePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (postId) => postsAPI.likePost(postId),
        onMutate: async (postId) => {
            await queryClient.cancelQueries({ queryKey: ['post', postId] });
            await queryClient.cancelQueries({ queryKey: ['posts'] });
            await queryClient.cancelQueries({ queryKey: ['user-posts'] });

            const previousPost = queryClient.getQueryData(['post', postId]);
            const previousFeed = queryClient.getQueryData(['posts', 'feed']);
            const previousUserPosts = queryClient.getQueriesData({ queryKey: ['user-posts'] });

            updatePostInCaches(queryClient, postId, (post) => ({
                ...post,
                is_liked: true,
                likes_count: (post.likes_count ?? 0) + 1,
            }));

            return { previousPost, previousFeed, previousUserPosts };
        },
        onSuccess: (response, postId) => {
            const count = response?.data?.likes_count;
            if (typeof count === 'number') {
                updatePostInCaches(queryClient, postId, (post) => ({
                    ...post,
                    is_liked: true,
                    likes_count: count,
                }));
            }
        },
        onError: (err, postId, context) => {
            if (context?.previousPost) queryClient.setQueryData(['post', postId], context.previousPost);
            if (context?.previousFeed) queryClient.setQueryData(['posts', 'feed'], context.previousFeed);
            context?.previousUserPosts?.forEach(([key, data]) => queryClient.setQueryData(key, data));
            toast.error('Failed to like post');
        },
        onSettled: (postId) => {
            queryClient.invalidateQueries({ queryKey: ['post', postId] });
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            queryClient.invalidateQueries({ queryKey: ['user-posts'] });
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
            await queryClient.cancelQueries({ queryKey: ['user-posts'] });

            const previousPost = queryClient.getQueryData(['post', postId]);
            const previousFeed = queryClient.getQueryData(['posts', 'feed']);
            const previousUserPosts = queryClient.getQueriesData({ queryKey: ['user-posts'] });

            updatePostInCaches(queryClient, postId, (post) => ({
                ...post,
                is_liked: false,
                likes_count: Math.max(0, (post.likes_count ?? 0) - 1),
            }));

            return { previousPost, previousFeed, previousUserPosts };
        },
        onSuccess: (response, postId) => {
            const count = response?.data?.likes_count;
            if (typeof count === 'number') {
                updatePostInCaches(queryClient, postId, (post) => ({
                    ...post,
                    is_liked: false,
                    likes_count: count,
                }));
            }
        },
        onError: (err, postId, context) => {
            if (context?.previousPost) queryClient.setQueryData(['post', postId], context.previousPost);
            if (context?.previousFeed) queryClient.setQueryData(['posts', 'feed'], context.previousFeed);
            context?.previousUserPosts?.forEach(([key, data]) => queryClient.setQueryData(key, data));
            toast.error('Failed to unlike post');
        },
        onSettled: (postId) => {
            queryClient.invalidateQueries({ queryKey: ['post', postId] });
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            queryClient.invalidateQueries({ queryKey: ['user-posts'] });
        },
    });
};

export const useSharePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (postId) => postsAPI.sharePost(postId),
        onSuccess: (response, postId) => {
            const count = response?.data?.shares_count;
            if (typeof count === 'number') {
                updatePostInCaches(queryClient, postId, (post) => ({
                    ...post,
                    shares_count: count,
                }));
            } else {
                updatePostInCaches(queryClient, postId, (post) => ({
                    ...post,
                    shares_count: (post.shares_count ?? 0) + 1,
                }));
            }
        },
        onError: () => {
            toast.error('Failed to record share');
        },
    });
};
