import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    useCommunity,
    useCommunityPosts,
    useJoinCommunity,
    useCancelJoinRequest,
    useLeaveCommunity,
    useDeleteCommunity,
    usePendingCommunityPosts,
    useApproveCommunityPost,
    useRejectCommunityPost,
    usePendingCommunityInvites,
    useInviteToCommunity,
    useSuggestCommunityInvite,
    useApproveCommunityInvite,
    useRejectCommunityInvite,
    useCommunityJoinRequests,
    useApproveJoinRequest,
    useRejectJoinRequest,
    useCommunityMembers,
    useUpdateMemberRole,
    useRemoveCommunityMember,
} from '../hooks/useCommunities';
import useAuthStore from '../store/authStore';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import PostCard from '../components/posts/PostCard';
import CommunityPostInput from '../components/posts/CommunityPostInput';
import { CommunitySkeleton, FeedSkeleton } from '../components/common/skeletons';
import Modal from '../components/common/Modal';
import InviteUserModal from '../components/communities/InviteUserModal';

const PENDING_APPROVAL = 'pending_approval';

const CommunityDetail = () => {
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState('posts');
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [suggestModalOpen, setSuggestModalOpen] = useState(false);
    const [pendingInvitesModalOpen, setPendingInvitesModalOpen] = useState(false);
    const [joinRequestsModalOpen, setJoinRequestsModalOpen] = useState(false);
    const [membersModalOpen, setMembersModalOpen] = useState(false);
    const user = useAuthStore((state) => state.user);
    const { data: communityData, isLoading: isLoadingCommunity } = useCommunity(id);
    const { data: postsData, isLoading: isLoadingPosts } = useCommunityPosts(id);
    const { data: pendingData, isLoading: isLoadingPending } = usePendingCommunityPosts(
        id,
        !!communityData?.community?.is_moderator && !!(communityData?.community?.requires_approval)
    );
    const { data: invitesData } = usePendingCommunityInvites(id, !!communityData?.community && communityData?.community?.creator?.id === user?.id);
    const joinMutation = useJoinCommunity();
    const leaveMutation = useLeaveCommunity();
    const deleteMutation = useDeleteCommunity();
    const approveMutation = useApproveCommunityPost(id);
    const rejectMutation = useRejectCommunityPost(id);
    const inviteMutation = useInviteToCommunity(id);
    const suggestMutation = useSuggestCommunityInvite(id);
    const approveInviteMutation = useApproveCommunityInvite(id);
    const rejectInviteMutation = useRejectCommunityInvite(id);
    const cancelJoinMutation = useCancelJoinRequest();
    const { data: joinRequestsData } = useCommunityJoinRequests(id, !!communityData?.community && (communityData?.community?.creator?.id === user?.id || communityData?.community?.is_moderator));
    const approveJoinMutation = useApproveJoinRequest(id);
    const rejectJoinMutation = useRejectJoinRequest(id);
    const { data: membersData } = useCommunityMembers(id, membersModalOpen && !!id && !!communityData?.is_member);
    const updateRoleMutation = useUpdateMemberRole(id);
    const removeMemberMutation = useRemoveCommunityMember(id);

    const community = communityData?.community;
    const isMember = communityData?.is_member || false;
    const hasPendingJoinRequest = communityData?.has_pending_join_request ?? false;
    const isCreator = community?.creator?.id === user?.id;
    const isModerator = community?.is_moderator || false;
    const requiresApproval = community?.requires_approval || false;
    const posts = postsData?.posts || [];
    const pendingPosts = pendingData?.posts || [];
    const pendingInvites = invitesData?.invites ?? [];
    const pendingApprovalCount = pendingInvites.filter((i) => i.status === PENDING_APPROVAL).length;
    const joinRequests = joinRequestsData?.join_requests ?? [];
    const members = membersData?.members ?? [];

    const handleJoin = () => {
        joinMutation.mutate(id);
    };

    const handleCancelJoinRequest = () => {
        cancelJoinMutation.mutate(id);
    };

    const handleLeave = () => {
        leaveMutation.mutate(id);
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this community? This action cannot be undone.')) {
            deleteMutation.mutate(id, {
                onSuccess: () => {
                    window.location.href = '/communities';
                },
            });
        }
    };

    if (isLoadingCommunity) {
        return (
            <div className="max-w-4xl mx-auto py-8">
                <CommunitySkeleton variant="detail" />
            </div>
        );
    }

    if (!community) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <p className="text-red-500 dark:text-red-400">Community not found.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Community Header */}
            <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 mb-6 shadow-[var(--shadow-card)]">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                        <Avatar src={community.avatar} alt={community.name} size="xl" />
                        <div>
                            <h1 className="text-2xl font-bold text-[var(--text-primary)]">{community.name}</h1>
                            <p className="text-sm text-[var(--text-secondary)] mt-1">
                                Created by {community.creator?.name || 'Unknown'}
                            </p>
                            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2">
                                <span className="text-sm text-[var(--text-secondary)]">
                                    {isMember ? (
                                        <button
                                            type="button"
                                            onClick={() => setMembersModalOpen(true)}
                                            className="hover:text-[var(--theme-accent)] hover:underline focus:outline-none focus:underline"
                                        >
                                            {community.members_count || 0} members
                                        </button>
                                    ) : (
                                        <span>{community.members_count || 0} members</span>
                                    )}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded ${
                                    community.privacy === 'private'
                                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                        : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                }`}>
                                    {community.privacy === 'private' ? 'Private' : 'Public'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-1.5 shrink-0">
                        {isCreator ? (
                            <>
                                <Button variant="primary" size="sm" onClick={() => setInviteModalOpen(true)} className="!px-2.5 !py-1 !text-xs">
                                    Invite
                                </Button>
                                {joinRequests.length > 0 && (
                                    <Button variant="outline" size="sm" onClick={() => setJoinRequestsModalOpen(true)} className="!px-2.5 !py-1 !text-xs">
                                        Join requests ({joinRequests.length})
                                    </Button>
                                )}
                                {pendingApprovalCount > 0 && (
                                    <Button variant="outline" size="sm" onClick={() => setPendingInvitesModalOpen(true)} className="!px-2.5 !py-1 !text-xs">
                                        Pending invites ({pendingApprovalCount})
                                    </Button>
                                )}
                                <span className="w-px h-4 bg-[var(--theme-border)] mx-0.5 hidden sm:block" aria-hidden />
                                <Button variant="outline" size="sm" onClick={() => setMembersModalOpen(true)} className="!px-2.5 !py-1 !text-xs">
                                    Members
                                </Button>
                                <Button variant="outline" size="sm" className="!px-2.5 !py-1 !text-xs">
                                    Edit
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleDelete} disabled={deleteMutation.isPending} className="!px-2.5 !py-1 !text-xs text-red-600 border-red-500/40 hover:bg-red-500/10">
                                    Delete
                                </Button>
                            </>
                        ) : isModerator ? (
                            <>
                                {joinRequests.length > 0 && (
                                    <Button variant="outline" size="sm" onClick={() => setJoinRequestsModalOpen(true)} className="!px-2.5 !py-1 !text-xs">
                                        Join requests ({joinRequests.length})
                                    </Button>
                                )}
                                <Button variant="outline" size="sm" onClick={() => setMembersModalOpen(true)} className="!px-2.5 !py-1 !text-xs">
                                    Members
                                </Button>
                                <span className="w-px h-4 bg-[var(--theme-border)] mx-0.5 hidden sm:block" aria-hidden />
                                <Button variant="outline" size="sm" onClick={handleLeave} disabled={leaveMutation.isPending} loading={leaveMutation.isPending} className="!px-2.5 !py-1 !text-xs">
                                    Leave
                                </Button>
                            </>
                        ) : isMember ? (
                            <>
                                <Button variant="outline" size="sm" onClick={() => setMembersModalOpen(true)} className="!px-2.5 !py-1 !text-xs">
                                    Members
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setSuggestModalOpen(true)} className="!px-2.5 !py-1 !text-xs">
                                    Suggest member
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleLeave} disabled={leaveMutation.isPending} loading={leaveMutation.isPending} className="!px-2.5 !py-1 !text-xs">
                                    Leave
                                </Button>
                            </>
                        ) : hasPendingJoinRequest ? (
                            <>
                                <span className="text-xs text-[var(--text-secondary)]">Pending</span>
                                <Button variant="outline" size="sm" onClick={handleCancelJoinRequest} disabled={cancelJoinMutation.isPending} loading={cancelJoinMutation.isPending} className="!px-2.5 !py-1 !text-xs">
                                    Cancel request
                                </Button>
                            </>
                        ) : (
                            <Button variant="primary" size="sm" onClick={handleJoin} disabled={joinMutation.isPending} loading={joinMutation.isPending} className="!px-2.5 !py-1 !text-xs">
                                Request to join
                            </Button>
                        )}
                    </div>
                </div>
                {community.description && (
                    <p className="text-[var(--text-primary)] mt-4">{community.description}</p>
                )}
            </div>

            <InviteUserModal
                isOpen={inviteModalOpen}
                onClose={() => setInviteModalOpen(false)}
                title="Invite to community"
                onSelect={(userId) => inviteMutation.mutate(userId)}
                loading={inviteMutation.isPending}
            />
            <InviteUserModal
                isOpen={suggestModalOpen}
                onClose={() => setSuggestModalOpen(false)}
                title="Suggest member (admin will approve)"
                onSelect={(userId) => suggestMutation.mutate(userId)}
                loading={suggestMutation.isPending}
            />
            <Modal
                isOpen={pendingInvitesModalOpen}
                onClose={() => setPendingInvitesModalOpen(false)}
                title="Pending invites"
                size="md"
            >
                <div className="space-y-2 max-h-80 overflow-y-auto">
                    {pendingInvites.length === 0 ? (
                        <p className="text-sm text-[var(--text-secondary)] py-4 text-center">No pending invites</p>
                    ) : (
                        pendingInvites.map((inv) => (
                            <div
                                key={inv.id}
                                className="flex items-center justify-between gap-3 p-3 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)]"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <Avatar src={inv.invited_user?.profile_picture} alt={inv.invited_user?.name} size="md" />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                                            {inv.invited_user?.name}
                                        </p>
                                        <p className="text-xs text-[var(--text-secondary)]">
                                            {inv.status === PENDING_APPROVAL && inv.inviter?.name
                                                ? `Suggested by ${inv.inviter.name}`
                                                : 'Direct invite'}
                                        </p>
                                    </div>
                                </div>
                                {inv.status === PENDING_APPROVAL && (
                                    <div className="flex gap-2 shrink-0">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => rejectInviteMutation.mutate(inv.id)}
                                            disabled={rejectInviteMutation.isPending}
                                        >
                                            Reject
                                        </Button>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => approveInviteMutation.mutate(inv.id)}
                                            disabled={approveInviteMutation.isPending}
                                            loading={approveInviteMutation.isPending}
                                        >
                                            Approve
                                        </Button>
                                    </div>
                                )}
                                {inv.status === 'pending' && (
                                    <span className="text-xs text-[var(--text-secondary)] shrink-0">Waiting for response</span>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </Modal>

            <Modal
                isOpen={joinRequestsModalOpen}
                onClose={() => setJoinRequestsModalOpen(false)}
                title="Join requests"
                size="md"
            >
                <div className="space-y-2 max-h-80 overflow-y-auto">
                    {joinRequests.length === 0 ? (
                        <p className="text-sm text-[var(--text-secondary)] py-4 text-center">No pending requests</p>
                    ) : (
                        joinRequests.map((req) => (
                            <div
                                key={req.id}
                                className="flex items-center justify-between gap-3 p-3 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)]"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <Avatar src={req.user?.profile_picture} alt={req.user?.name} size="md" />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{req.user?.name}</p>
                                        <p className="text-xs text-[var(--text-secondary)]">@{req.user?.username}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => rejectJoinMutation.mutate(req.id)}
                                        disabled={rejectJoinMutation.isPending}
                                    >
                                        Reject
                                    </Button>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => approveJoinMutation.mutate(req.id)}
                                        disabled={approveJoinMutation.isPending}
                                        loading={approveJoinMutation.isPending}
                                    >
                                        Approve
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Modal>

            <Modal
                isOpen={membersModalOpen}
                onClose={() => setMembersModalOpen(false)}
                title="Members"
                size="md"
            >
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {members.length === 0 ? (
                        <p className="text-sm text-[var(--text-secondary)] py-4 text-center">No members</p>
                    ) : (
                        members.map((m) => (
                            <div
                                key={m.id}
                                className="flex items-center justify-between gap-3 p-3 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)]"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <Avatar src={m.profile_picture} alt={m.name} size="md" />
                                    <div className="min-w-0 flex items-center gap-2 flex-wrap">
                                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{m.name}</p>
                                        {m.is_creator ? (
                                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                                                Creator
                                            </span>
                                        ) : (m.role === 'admin' || m.role === 'moderator') ? (
                                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--theme-accent)]/20 text-[var(--theme-accent)] shrink-0">
                                                Admin
                                            </span>
                                        ) : null}
                                        <p className="text-xs text-[var(--text-secondary)] w-full">@{m.username}</p>
                                    </div>
                                </div>
                                {!m.is_creator && isCreator && (
                                    <div className="flex items-center gap-2 shrink-0">
                                        {(m.role === 'admin' || m.role === 'moderator') && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => updateRoleMutation.mutate({ userId: m.id, role: 'member' })}
                                                disabled={updateRoleMutation.isPending}
                                            >
                                                Demote to member
                                            </Button>
                                        )}
                                        {m.role !== 'admin' && m.role !== 'moderator' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => updateRoleMutation.mutate({ userId: m.id, role: 'admin' })}
                                                disabled={updateRoleMutation.isPending}
                                            >
                                                Make admin
                                            </Button>
                                        )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                if (window.confirm(`Remove ${m.name} from the community?`)) {
                                                    removeMemberMutation.mutate(m.id);
                                                }
                                            }}
                                            disabled={removeMemberMutation.isPending}
                                            className="text-red-600 hover:bg-red-500/10 border-red-500/30"
                                        >
                                            Kick
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </Modal>

            {/* Post input for members */}
            {isMember && (
                <div className="mb-6">
                    <CommunityPostInput
                        communityId={id}
                        requiresApproval={requiresApproval}
                        onPostSubmitted={() => {}}
                    />
                </div>
            )}

            {/* Community Posts / Pending Posts tabs */}
            <div>
                <div className="flex flex-wrap items-center gap-4 mb-4">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">Community Posts</h2>
                    {isModerator && requiresApproval && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setActiveTab('posts')}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                    activeTab === 'posts'
                                        ? 'bg-[var(--theme-accent)] text-white'
                                        : 'bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)]'
                                }`}
                            >
                                Approved
                            </button>
                            <button
                                onClick={() => setActiveTab('pending')}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors ${
                                    activeTab === 'pending'
                                        ? 'bg-amber-500 text-white'
                                        : 'bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)]'
                                }`}
                            >
                                Pending {pendingPosts.length > 0 && `(${pendingPosts.length})`}
                            </button>
                        </div>
                    )}
                </div>

                {activeTab === 'posts' && (
                    <>
                        {isLoadingPosts ? (
                    <FeedSkeleton cards={3} showComposer={false} />
                ) : posts.length === 0 ? (
                    <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-10 text-center">
                        <span className="material-symbols-outlined text-4xl text-[var(--text-secondary)]/50 mb-3 block">article</span>
                        <p className="text-[var(--text-primary)] font-medium">No posts yet</p>
                        <p className="text-sm text-[var(--text-secondary)] mt-1">Be the first to post in this community.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {posts.map((post) => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>
                )}
                    </>
                )}

                {activeTab === 'pending' && isModerator && requiresApproval && (
                    <>
                        {isLoadingPending ? (
                            <FeedSkeleton cards={2} showComposer={false} />
                        ) : pendingPosts.length === 0 ? (
                            <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-10 text-center">
                                <span className="material-symbols-outlined text-4xl text-[var(--text-secondary)]/50 mb-3 block">pending_actions</span>
                                <p className="text-[var(--text-primary)] font-medium">No pending posts</p>
                                <p className="text-sm text-[var(--text-secondary)] mt-1">Posts waiting for approval will appear here.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {pendingPosts.map((post) => (
                                    <div key={post.id} className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] overflow-hidden">
                                        <PostCard post={post} />
                                        <div className="flex items-center justify-end gap-2 p-3 border-t border-[var(--theme-border)]">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => rejectMutation.mutate(post.id)}
                                                disabled={rejectMutation.isPending}
                                            >
                                                Reject
                                            </Button>
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => approveMutation.mutate(post.id)}
                                                disabled={approveMutation.isPending}
                                                loading={approveMutation.isPending}
                                            >
                                                Approve
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default CommunityDetail;
