import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    useCommunity,
    useCommunityPosts,
    useJoinCommunity,
    useLeaveCommunity,
    useDeleteCommunity,
    usePendingCommunityPosts,
    useApproveCommunityPost,
    useRejectCommunityPost,
} from '../hooks/useCommunities';
import useAuthStore from '../store/authStore';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import PostCard from '../components/posts/PostCard';
import CommunityPostInput from '../components/posts/CommunityPostInput';
import LoadingSpinner from '../components/common/LoadingSpinner';

const CommunityDetail = () => {
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState('posts');
    const user = useAuthStore((state) => state.user);
    const { data: communityData, isLoading: isLoadingCommunity } = useCommunity(id);
    const { data: postsData, isLoading: isLoadingPosts } = useCommunityPosts(id);
    const { data: pendingData, isLoading: isLoadingPending } = usePendingCommunityPosts(
        id,
        !!communityData?.community?.is_moderator && !!(communityData?.community?.requires_approval)
    );
    const joinMutation = useJoinCommunity();
    const leaveMutation = useLeaveCommunity();
    const deleteMutation = useDeleteCommunity();
    const approveMutation = useApproveCommunityPost(id);
    const rejectMutation = useRejectCommunityPost(id);

    const community = communityData?.community;
    const isMember = communityData?.is_member || false;
    const isCreator = community?.creator?.id === user?.id;
    const isModerator = community?.is_moderator || false;
    const requiresApproval = community?.requires_approval || false;
    const posts = postsData?.posts || [];
    const pendingPosts = pendingData?.posts || [];

    const handleJoin = () => {
        joinMutation.mutate(id);
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
            <div className="max-w-4xl mx-auto flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!community) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">Community not found.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Community Header */}
            <div className="theme-surface rounded-lg border border-gray-200 p-6 mb-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                        <Avatar src={community.avatar} alt={community.name} size="xl" />
                        <div>
                            <h1 className="text-2xl font-bold theme-text">{community.name}</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Created by {community.creator?.name || 'Unknown'}
                            </p>
                            <div className="flex items-center space-x-4 mt-2">
                                <span className="text-sm text-gray-500">
                                    {community.members_count || 0} members
                                </span>
                                <span className={`text-xs px-2 py-1 rounded ${
                                    community.privacy === 'private' 
                                        ? 'bg-yellow-100 text-yellow-800' 
                                        : 'bg-green-100 text-green-800'
                                }`}>
                                    {community.privacy === 'private' ? 'Private' : 'Public'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {isCreator ? (
                            <>
                                <Button variant="outline" size="sm">
                                    Edit
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={handleDelete}
                                    disabled={deleteMutation.isPending}
                                >
                                    Delete
                                </Button>
                            </>
                        ) : isMember ? (
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={handleLeave}
                                disabled={leaveMutation.isPending}
                                loading={leaveMutation.isPending}
                            >
                                Leave
                            </Button>
                        ) : (
                            <Button 
                                variant="primary" 
                                size="sm"
                                onClick={handleJoin}
                                disabled={joinMutation.isPending}
                                loading={joinMutation.isPending}
                            >
                                Join
                            </Button>
                        )}
                    </div>
                </div>
                {community.description && (
                    <p className="text-gray-700 mt-4">{community.description}</p>
                )}
            </div>

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
                <div className="flex items-center gap-4 mb-4">
                    <h2 className="text-lg font-semibold theme-text">Community Posts</h2>
                    {isModerator && requiresApproval && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setActiveTab('posts')}
                                className={`px-3 py-1 rounded text-sm font-medium ${
                                    activeTab === 'posts'
                                        ? 'bg-[var(--theme-accent)] text-white'
                                        : 'theme-surface text-gray-400 hover:text-white'
                                }`}
                            >
                                Approved
                            </button>
                            <button
                                onClick={() => setActiveTab('pending')}
                                className={`px-3 py-1 rounded text-sm font-medium flex items-center gap-1 ${
                                    activeTab === 'pending'
                                        ? 'bg-amber-500 text-white'
                                        : 'theme-surface text-gray-400 hover:text-white'
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
                    <div className="flex items-center justify-center py-12">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : posts.length === 0 ? (
                    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center theme-surface">
                        <p className="text-gray-500">No posts yet. Be the first to post!</p>
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
                            <div className="flex items-center justify-center py-12">
                                <LoadingSpinner size="lg" />
                            </div>
                        ) : pendingPosts.length === 0 ? (
                            <div className="theme-surface rounded-lg border border-gray-200 p-8 text-center">
                                <p className="text-gray-500">No pending posts.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {pendingPosts.map((post) => (
                                    <div key={post.id} className="theme-surface rounded-lg border border-gray-200 overflow-hidden">
                                        <PostCard post={post} />
                                        <div className="flex items-center justify-end gap-2 p-3 border-t border-gray-200">
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
