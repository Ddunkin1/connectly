import React, { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getEcho } from '../../echo';
import { updatePostInCaches } from '../../hooks/usePosts';

/**
 * Subscribes to the post-updates channel so that when anyone likes or comments
 * on a post, the feed and post caches are updated in real time (no refresh).
 */
export default function RealtimePostUpdatesProvider({ children }) {
    const queryClient = useQueryClient();

    useEffect(() => {
        const echo = getEcho();
        if (!echo) return;

        const channel = echo.private('post-updates');

        channel.listen('.PostLiked', (payload) => {
            const postId = payload?.post_id;
            const likesCount = payload?.likes_count;
            if (postId == null || typeof likesCount !== 'number') return;

            updatePostInCaches(queryClient, postId, (post) => ({
                ...post,
                likes_count: likesCount,
            }));
        });

        channel.listen('.PostCommented', (payload) => {
            const postId = payload?.post_id;
            const commentsCount = payload?.comments_count;
            if (postId == null) return;

            updatePostInCaches(queryClient, postId, (post) => ({
                ...post,
                comments_count: typeof commentsCount === 'number' ? commentsCount : (post?.comments_count ?? 0) + 1,
            }));

            queryClient.invalidateQueries({ queryKey: ['comments', postId] });
        });

        return () => {
            channel.stopListening('.PostLiked');
            channel.stopListening('.PostCommented');
            echo.leave('post-updates');
        };
    }, [queryClient]);

    return children;
}
