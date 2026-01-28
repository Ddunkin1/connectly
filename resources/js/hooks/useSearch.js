import { useQuery } from '@tanstack/react-query';
import { searchAPI } from '../services/api';

export const useSearch = (query, type = 'all', enabled = true) => {
    return useQuery({
        queryKey: ['search', query, type],
        queryFn: () => searchAPI.search(query, type),
        enabled: enabled && !!query && query.trim().length > 0,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
};
