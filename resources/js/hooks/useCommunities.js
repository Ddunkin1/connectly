import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communityAPI } from '../services/api';
import toast from 'react-hot-toast';

export const useCommunities = (params = {}) => {
    return useQuery({
        queryKey: ['communities', params],
        queryFn: () => communityAPI.getAll(params),
        select: (data) => data.data,
    });
};

export const useCommunity = (id) => {
    return useQuery({
        queryKey: ['community', id],
        queryFn: () => communityAPI.getById(id),
        enabled: !!id,
        select: (data) => data.data,
    });
};

export const useCommunityPosts = (id, params = {}) => {
    return useQuery({
        queryKey: ['community-posts', id, params],
        queryFn: () => communityAPI.getPosts(id, params),
        enabled: !!id,
        select: (data) => data.data,
    });
};

export const useCreateCommunity = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => communityAPI.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['communities'] });
            toast.success('Community created successfully');
        },
        onError: (error) => {
            const message = error.response?.data?.message || 'Failed to create community';
            const errors = error.response?.data?.errors;
            if (errors) {
                Object.values(errors).flat().forEach((err) => toast.error(err));
            } else {
                toast.error(message);
            }
        },
    });
};

export const useUpdateCommunity = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => communityAPI.update(id, data),
        onSuccess: (response, variables) => {
            queryClient.invalidateQueries({ queryKey: ['communities'] });
            queryClient.invalidateQueries({ queryKey: ['community', variables.id] });
            toast.success('Community updated successfully');
        },
        onError: (error) => {
            const message = error.response?.data?.message || 'Failed to update community';
            const errors = error.response?.data?.errors;
            if (errors) {
                Object.values(errors).flat().forEach((err) => toast.error(err));
            } else {
                toast.error(message);
            }
        },
    });
};

export const useDeleteCommunity = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => communityAPI.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['communities'] });
            toast.success('Community deleted successfully');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to delete community');
        },
    });
};

export const useJoinCommunity = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => communityAPI.join(id),
        onSuccess: (response, id) => {
            queryClient.invalidateQueries({ queryKey: ['communities'] });
            queryClient.invalidateQueries({ queryKey: ['community', id] });
            toast.success(response?.data?.message || 'Request to join sent');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to send request');
        },
    });
};

export const useCancelJoinRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (communityId) => communityAPI.cancelJoinRequest(communityId),
        onSuccess: (_, communityId) => {
            queryClient.invalidateQueries({ queryKey: ['community', communityId] });
            queryClient.invalidateQueries({ queryKey: ['communities'] });
            toast.success('Join request cancelled');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to cancel request');
        },
    });
};

export const useCommunityJoinRequests = (communityId, enabled = true) => {
    return useQuery({
        queryKey: ['community-join-requests', communityId],
        queryFn: () => communityAPI.getJoinRequests(communityId),
        enabled: !!communityId && enabled,
        select: (data) => data.data,
    });
};

export const useApproveJoinRequest = (communityId) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (joinRequestId) => communityAPI.approveJoinRequest(communityId, joinRequestId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['community-join-requests', communityId] });
            queryClient.invalidateQueries({ queryKey: ['community', communityId] });
            queryClient.invalidateQueries({ queryKey: ['community-members', communityId] });
            toast.success('Request approved');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to approve');
        },
    });
};

export const useRejectJoinRequest = (communityId) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (joinRequestId) => communityAPI.rejectJoinRequest(communityId, joinRequestId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['community-join-requests', communityId] });
            queryClient.invalidateQueries({ queryKey: ['community', communityId] });
            toast.success('Request rejected');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to reject');
        },
    });
};

export const useCommunityMembers = (communityId, enabled = true) => {
    return useQuery({
        queryKey: ['community-members', communityId],
        queryFn: async () => {
            const res = await communityAPI.getMembers(communityId);
            return res?.data ?? res ?? {};
        },
        enabled: !!communityId && enabled,
        select: (data) => ({
            members: Array.isArray(data?.members) ? data.members : [],
        }),
        refetchOnMount: true,
    });
};

export const useUpdateMemberRole = (communityId) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, role }) => communityAPI.updateMemberRole(communityId, userId, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['community-members', communityId] });
            queryClient.invalidateQueries({ queryKey: ['community', communityId] });
            toast.success('Role updated');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update role');
        },
    });
};

export const useRemoveCommunityMember = (communityId) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userId) => communityAPI.removeMember(communityId, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['community-members', communityId] });
            queryClient.invalidateQueries({ queryKey: ['community', communityId] });
            toast.success('Member removed');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to remove member');
        },
    });
};

export const useLeaveCommunity = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => communityAPI.leave(id),
        onSuccess: (response, id) => {
            queryClient.invalidateQueries({ queryKey: ['communities'] });
            queryClient.invalidateQueries({ queryKey: ['community', id] });
            toast.success('Successfully left community');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to leave community');
        },
    });
};

export const useSubmitCommunityPost = (communityId) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => communityAPI.submitPost(communityId, data),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['community-posts', communityId] });
            queryClient.invalidateQueries({ queryKey: ['community-posts-pending', communityId] });
            queryClient.invalidateQueries({ queryKey: ['community', communityId] });
            toast.success(response?.data?.message || 'Post submitted');
        },
        onError: (error) => {
            const message = error.response?.data?.message || 'Failed to submit post';
            const errors = error.response?.data?.errors;
            if (errors) {
                Object.values(errors).flat().forEach((err) => toast.error(err));
            } else {
                toast.error(message);
            }
        },
    });
};

export const usePendingCommunityPosts = (communityId, enabled = true) => {
    return useQuery({
        queryKey: ['community-posts-pending', communityId],
        queryFn: () => communityAPI.getPendingPosts(communityId),
        enabled: !!communityId && enabled,
        select: (data) => data.data,
    });
};

export const useApproveCommunityPost = (communityId) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (postId) => communityAPI.approvePost(communityId, postId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['community-posts', communityId] });
            queryClient.invalidateQueries({ queryKey: ['community-posts-pending', communityId] });
            toast.success('Post approved');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to approve post');
        },
    });
};

export const useRejectCommunityPost = (communityId) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (postId) => communityAPI.rejectPost(communityId, postId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['community-posts', communityId] });
            queryClient.invalidateQueries({ queryKey: ['community-posts-pending', communityId] });
            toast.success('Post rejected');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to reject post');
        },
    });
};

export const usePendingCommunityInvites = (communityId, enabled = true) => {
    return useQuery({
        queryKey: ['community-invites', communityId],
        queryFn: () => communityAPI.getPendingInvites(communityId),
        enabled: !!communityId && enabled,
        select: (data) => data.data,
    });
};

export const useInviteToCommunity = (communityId) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userId) => communityAPI.invite(communityId, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['community-invites', communityId] });
            queryClient.invalidateQueries({ queryKey: ['community', communityId] });
            toast.success('Invite sent');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to send invite');
        },
    });
};

export const useSuggestCommunityInvite = (communityId) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userId) => communityAPI.suggestInvite(communityId, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['community-invites', communityId] });
            toast.success('Suggestion sent to community admin');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to suggest invite');
        },
    });
};

export const useApproveCommunityInvite = (communityId) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (inviteId) => communityAPI.approveInvite(communityId, inviteId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['community-invites', communityId] });
            queryClient.invalidateQueries({ queryKey: ['community', communityId] });
            toast.success('Invite approved');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to approve invite');
        },
    });
};

export const useRejectCommunityInvite = (communityId) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (inviteId) => communityAPI.rejectInvite(communityId, inviteId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['community-invites', communityId] });
            toast.success('Invite rejected');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to reject invite');
        },
    });
};

export const useAcceptCommunityInvite = (communityId) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (inviteId) => communityAPI.acceptInvite(communityId, inviteId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['community', communityId] });
            queryClient.invalidateQueries({ queryKey: ['communities'] });
            toast.success('You joined the community');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to accept invite');
        },
    });
};

export const useDeclineCommunityInvite = (communityId) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (inviteId) => communityAPI.declineInvite(communityId, inviteId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['community', communityId] });
            toast.success('Invite declined');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to decline invite');
        },
    });
};

/** For use in notifications: pass { communityId, inviteId } to mutate. */
export const useAcceptCommunityInviteAny = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ communityId, inviteId }) => communityAPI.acceptInvite(communityId, inviteId),
        onSuccess: (_, { communityId }) => {
            queryClient.invalidateQueries({ queryKey: ['community', communityId] });
            queryClient.invalidateQueries({ queryKey: ['communities'] });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success('You joined the community');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to accept invite');
        },
    });
};

/** For use in notifications: pass { communityId, inviteId } to mutate. */
export const useDeclineCommunityInviteAny = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ communityId, inviteId }) => communityAPI.declineInvite(communityId, inviteId),
        onSuccess: (_, { communityId }) => {
            queryClient.invalidateQueries({ queryKey: ['community', communityId] });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success('Invite declined');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to decline invite');
        },
    });
};

/** For use in notifications (creator): pass { communityId, inviteId } to mutate. */
export const useApproveCommunityInviteAny = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ communityId, inviteId }) => communityAPI.approveInvite(communityId, inviteId),
        onSuccess: (_, { communityId }) => {
            queryClient.invalidateQueries({ queryKey: ['community-invites', communityId] });
            queryClient.invalidateQueries({ queryKey: ['community', communityId] });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success('Invite approved');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to approve invite');
        },
    });
};

/** For use in notifications (creator): pass { communityId, inviteId } to mutate. */
export const useRejectCommunityInviteAny = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ communityId, inviteId }) => communityAPI.rejectInvite(communityId, inviteId),
        onSuccess: (_, { communityId }) => {
            queryClient.invalidateQueries({ queryKey: ['community-invites', communityId] });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success('Invite rejected');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to reject invite');
        },
    });
};

/** For use in notifications (admin): pass { communityId, joinRequestId } to mutate. */
export const useApproveJoinRequestAny = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ communityId, joinRequestId }) => communityAPI.approveJoinRequest(communityId, joinRequestId),
        onSuccess: (_, { communityId }) => {
            queryClient.invalidateQueries({ queryKey: ['community-join-requests', communityId] });
            queryClient.invalidateQueries({ queryKey: ['community', communityId] });
            queryClient.invalidateQueries({ queryKey: ['community-members', communityId] });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success('Request approved');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to approve');
        },
    });
};

/** For use in notifications (admin): pass { communityId, joinRequestId } to mutate. */
export const useRejectJoinRequestAny = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ communityId, joinRequestId }) => communityAPI.rejectJoinRequest(communityId, joinRequestId),
        onSuccess: (_, { communityId }) => {
            queryClient.invalidateQueries({ queryKey: ['community-join-requests', communityId] });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success('Request rejected');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to reject');
        },
    });
};
