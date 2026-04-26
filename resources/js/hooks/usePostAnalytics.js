import { useQuery } from '@tanstack/react-query';
import { postsAPI } from '../services/api';

export function usePostAnalytics(postId, enabled = false) {
    return useQuery({
        queryKey: ['post-analytics', postId],
        queryFn: () => postsAPI.getAnalytics(postId).then((r) => r.data),
        enabled: !!postId && enabled,
        staleTime: 60_000,
    });
}
