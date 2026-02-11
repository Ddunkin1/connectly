import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { bookmarksAPI } from '../services/api';
import toast from 'react-hot-toast';
import { updatePostInCaches } from './usePosts';

export const useBookmarks = () => {
    return useInfiniteQuery({
        queryKey: ['bookmarks'],
        queryFn: ({ pageParam = 1 }) => bookmarksAPI.getBookmarks(pageParam),
        getNextPageParam: (lastPage) => {
            const { pagination } = lastPage.data;
            return pagination.current_page < pagination.last_page
                ? pagination.current_page + 1
                : undefined;
        },
        initialPageParam: 1,
    });
};

export const useAddBookmark = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (postId) => bookmarksAPI.addBookmark(postId),
        onSuccess: (_, postId) => {
            updatePostInCaches(queryClient, postId, (post) => ({
                ...post,
                is_bookmarked: true,
            }));
            queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
            toast.success('Saved to bookmarks');
        },
        onError: () => {
            toast.error('Failed to save bookmark');
        },
    });
};

export const useRemoveBookmark = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (postId) => bookmarksAPI.removeBookmark(postId),
        onSuccess: (_, postId) => {
            updatePostInCaches(queryClient, postId, (post) => ({
                ...post,
                is_bookmarked: false,
            }));
            queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
            toast.success('Removed from bookmarks');
        },
        onError: () => {
            toast.error('Failed to remove bookmark');
        },
    });
};
