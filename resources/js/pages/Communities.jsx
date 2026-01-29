import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCommunities, useJoinCommunity, useLeaveCommunity } from '../hooks/useCommunities';
import useAuthStore from '../store/authStore';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Communities = () => {
    const user = useAuthStore((state) => state.user);
    const { data, isLoading, error } = useCommunities();
    const joinMutation = useJoinCommunity();
    const leaveMutation = useLeaveCommunity();

    // Separate communities into joined and suggested
    const joinedCommunities = data?.communities?.filter((community) => {
        return community.is_member === true;
    }) || [];

    const suggestedCommunities = data?.communities?.filter((community) => {
        return community.is_member === false;
    }) || [];

    const handleJoin = (communityId, e) => {
        e.preventDefault();
        e.stopPropagation();
        joinMutation.mutate(communityId);
    };

    const handleLeave = (communityId, e) => {
        e.preventDefault();
        e.stopPropagation();
        leaveMutation.mutate(communityId);
    };

    if (isLoading) {
        return (
            <div className="max-w-6xl mx-auto flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-6xl mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">Failed to load communities. Please try again.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Communities</h1>
                    <p className="text-gray-500 mt-1">Discover and join communities</p>
                </div>
                <Button variant="primary" size="sm">
                    Create Community
                </Button>
            </div>

            {/* Joined Communities */}
            {joinedCommunities.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Communities</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {joinedCommunities.map((community) => (
                            <Link
                                key={community.id}
                                to={`/communities/${community.id}`}
                                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start space-x-3">
                                    <Avatar src={community.avatar} alt={community.name} size="lg" />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900">{community.name}</h3>
                                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                            {community.description || 'No description'}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-2">
                                            {community.members_count || 0} members
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Suggested Communities */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Discover Communities</h2>
                {suggestedCommunities.length === 0 ? (
                    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                        <p className="text-gray-500">No communities available at the moment.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {suggestedCommunities.map((community) => {
                            const isJoining = joinMutation.isPending && joinMutation.variables === community.id;
                            const isLeaving = leaveMutation.isPending && leaveMutation.variables === community.id;
                            
                            return (
                                <div
                                    key={community.id}
                                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                                >
                                    <Link to={`/communities/${community.id}`}>
                                        <div className="flex items-start space-x-3 mb-3">
                                            <Avatar src={community.avatar} alt={community.name} size="lg" />
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-900">{community.name}</h3>
                                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                                    {community.description || 'No description'}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-2">
                                                    {community.members_count || 0} members
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="w-full"
                                        onClick={(e) => handleJoin(community.id, e)}
                                        disabled={isJoining || isLeaving}
                                        loading={isJoining}
                                    >
                                        {isJoining ? 'Joining...' : 'Join'}
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Communities;
