import { useQuery } from '@tanstack/react-query';
import { userAPI } from '../services/api';

export const useConnections = () => {
    return useQuery({
        queryKey: ['connections'],
        queryFn: () => userAPI.getConnections(),
        select: (res) => res.data,
    });
};

