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

// Normalize create post input: can be FormData or { formData, sharedPost }
function normalizeCreateInput(data) {
    const isPayload = data && typeof data === 'object' && !(data instanceof FormData) && 'formData' in data;
    const formData = isPayload ? data.formData : data;
    const sharedPost = isPayload ? data.sharedPost : null;
    return { formData, sharedPost };
}

export const useCreatePost = () => {
    const queryClient = useQueryClient();
    const user = useAuthStore((state) => state.user);

    return useMutation({
        mutationFn: (data) => {
            const { formData } = normalizeCreateInput(data);
            return postsAPI.createPost(formData);
        },
        onMutate: async (data) => {
            const { formData, sharedPost } = normalizeCreateInput(data);
            const raw = formData instanceof FormData ? formData : data;
            const get = (k) => (raw instanceof FormData ? raw.get(k) : raw?.[k]) ?? '';

            await queryClient.cancelQueries({ queryKey: ['posts', 'feed'] });
            await queryClient.cancelQueries({ queryKey: ['user-posts'] });

            const previousFeed = queryClient.getQueryData(['posts', 'feed']);
            const previousUserPostsByUsername = queryClient.getQueryData(['user-posts', user?.username]);
            const previousUserPostsById = queryClient.getQueryData(['user-posts', user?.id]);

            const optimisticPost = {
                id: `temp-${Date.now()}`,
                content: String(get('content') || ''),
                media_url: null,
                media_type: null,
                visibility: String(get('visibility') || 'public'),
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
                shared_post_id: raw instanceof FormData ? raw.get('shared_post_id') : raw?.shared_post_id,
                shared_post: sharedPost || null,
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

            queryClient.invalidateQueries({ queryKey: ['posts'] });
            queryClient.invalidateQueries({ queryKey: ['user-posts'] });
            queryClient.refetchQueries({ queryKey: ['posts'] });
            queryClient.refetchQueries({ queryKey: ['user-posts'] });
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
            queryClient.refetchQueries({ queryKey: ['post', variables.postId] });
            queryClient.refetchQueries({ queryKey: ['posts'] });
            queryClient.refetchQueries({ queryKey: ['user-posts'] });
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
        onSuccess: (_, postId) => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            queryClient.invalidateQueries({ queryKey: ['user-posts'] });
            queryClient.removeQueries({ queryKey: ['post', String(postId)] });
            queryClient.refetchQueries({ queryKey: ['posts'] });
            queryClient.refetchQueries({ queryKey: ['user-posts'] });
            toast.success('Post deleted successfully!');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to delete post');
        },
    });
};

// Helper: apply updater to post or to nested shared_post when postId matches
function applyPostUpdater(p, postId, updater) {
    if (String(p?.id) === String(postId)) return updater(p);
    if (p?.shared_post && String(p.shared_post.id) === String(postId)) {
        return { ...p, shared_post: updater(p.shared_post) };
    }
    return p;
}

// Export so useComments can update post counts when a comment is added
export function updatePostInCaches(queryClient, postId, updater) {
    // Single post (cache may be raw response { data: { post } } or just the post from usePost's select)
    queryClient.setQueryData(['post', postId], (old) => {
        if (!old) return old;
        if (old?.data?.post) {
            const post = applyPostUpdater(old.data.post, postId, updater);
            return post === old.data.post ? old : { ...old, data: { ...old.data, post } };
        }
        if (String(old?.id) === String(postId)) {
            return updater(old);
        }
        if (old?.shared_post && String(old.shared_post.id) === String(postId)) {
            return { ...old, shared_post: updater(old.shared_post) };
        }
        return old;
    });

    // Also update any other single-post cache where this post is the nested shared_post (e.g. parent post page)
    const postCaches = queryClient.getQueriesData({ queryKey: ['post'] });
    postCaches.forEach(([key, old]) => {
        if (!old) return;
        const post = old?.data?.post ?? (old?.id != null ? old : null);
        if (!post || !post.shared_post || String(post.shared_post.id) !== String(postId)) return;
        const updatedPost = { ...post, shared_post: updater(post.shared_post) };
        const next = old?.data != null
            ? { ...old, data: { ...old.data, post: updatedPost } }
            : updatedPost;
        queryClient.setQueryData(key, next);
    });

    // Feed (infinite query: pages[].data.posts or pages[].data.posts.data)
    queryClient.setQueryData(['posts', 'feed'], (old) => {
        if (!old?.pages) return old;
        return {
            ...old,
            pages: old.pages.map((page) => {
                const raw = page.data?.posts;
                const list = Array.isArray(raw) ? raw : raw?.data ?? [];
                const updated = list.map((p) => applyPostUpdater(p, postId, updater));
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
        const updated = data.posts.map((p) => applyPostUpdater(p, postId, updater));
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
            // Do not refetch: overwrites cache with stale data and causes count flicker
        },
        onError: (err, postId, context) => {
            if (context?.previousPost) queryClient.setQueryData(['post', postId], context.previousPost);
            if (context?.previousFeed) queryClient.setQueryData(['posts', 'feed'], context.previousFeed);
            context?.previousUserPosts?.forEach(([key, data]) => queryClient.setQueryData(key, data));
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
            // Do not refetch: overwrites cache with stale data and causes count flicker
        },
        onError: (err, postId, context) => {
            if (context?.previousPost) queryClient.setQueryData(['post', postId], context.previousPost);
            if (context?.previousFeed) queryClient.setQueryData(['posts', 'feed'], context.previousFeed);
            context?.previousUserPosts?.forEach(([key, data]) => queryClient.setQueryData(key, data));
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
            // Do not refetch: cache update is enough for detail page
        },
        onError: () => {
            toast.error('Failed to record share');
        },
    });
};
