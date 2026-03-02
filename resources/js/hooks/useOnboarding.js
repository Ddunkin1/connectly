import { useQuery } from '@tanstack/react-query';
import useAuthStore from '../store/authStore';
import { userAPI } from '../services/api';
import { useCommunities } from './useCommunities';
import { useSuggestedUsers } from './useUsers';

export const useOnboarding = () => {
    const user = useAuthStore((state) => state.user);

    const { data: analyticsData } = useQuery({
        queryKey: ['analytics'],
        queryFn: () => userAPI.getAnalytics(),
        select: (res) => res.data?.analytics ?? {},
        enabled: !!user,
    });

    const {
        data: communitiesData,
        isLoading: communitiesLoading,
        error: communitiesError,
    } = useCommunities();

    const { data: suggestedUsers = [], isLoading: suggestedUsersLoading } = useSuggestedUsers();

    const followingCount = analyticsData?.following_count ?? 0;
    const joinedCommunities =
        communitiesData?.communities?.filter((community) => community.is_member === true) ?? [];

    const hasProfileBasics = !!user?.bio && !!user?.profile_picture;
    const hasConnections = followingCount >= 3;
    const hasJoinedCommunity = joinedCommunities.length > 0;

    const totalSteps = 3;
    const completedSteps =
        (hasProfileBasics ? 1 : 0) +
        (hasConnections ? 1 : 0) +
        (hasJoinedCommunity ? 1 : 0);

    const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
    const isComplete = completedSteps === totalSteps;

    return {
        user,
        analytics: analyticsData,
        suggestedUsers,
        suggestedUsersLoading,
        communitiesData,
        communitiesLoading,
        communitiesError,
        joinedCommunities,
        hasProfileBasics,
        hasConnections,
        hasJoinedCommunity,
        followingCount,
        progress,
        isComplete,
    };
};

