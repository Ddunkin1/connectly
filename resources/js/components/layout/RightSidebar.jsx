import React from 'react';
import { Link } from 'react-router-dom';
import { useSuggestedUsers } from '../../hooks/useUsers';
import { useFollow, useUnfollow } from '../../hooks/useUsers';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';

const RightSidebar = () => {
    const { data: suggestedUsers, isLoading } = useSuggestedUsers();
    const followMutation = useFollow();
    const unfollowMutation = useUnfollow();

    // Mock data - replace with actual API calls
    const trendingTopics = [
        { tag: '#WebDevTips', category: 'Technology', posts: '12.5k' },
        { tag: '#FigmaUpdate', category: 'Design', posts: '8.2k' },
        { tag: '#NoCodeRevolution', category: 'Productivity', posts: '5.1k' },
    ];

    const suggestedCommunities = [
        { id: 1, name: 'Photography Club', members: '4.2k', icon: 'camera_alt' },
        { id: 2, name: 'Startup Founders', members: '12.8k', icon: 'rocket_launch' },
    ];

    const handleFollow = (userId, isFollowing) => {
        if (isFollowing) {
            unfollowMutation.mutate(userId);
        } else {
            followMutation.mutate(userId);
        }
    };

    return (
        <aside className="hidden xl:block w-80 bg-white border-l border-gray-200 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
            <div className="p-4 space-y-6">
                {/* Trending Topics */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-900">Trending Topics</h3>
                        <span className="material-symbols-outlined text-gray-400 text-lg">show_chart</span>
                    </div>
                    <div className="space-y-3">
                        {trendingTopics.map((topic, index) => (
                            <Link
                                key={index}
                                to={`/hashtag/${topic.tag.replace('#', '')}`}
                                className="block p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 mb-1">{topic.category}</p>
                                        <p className="text-sm font-semibold text-gray-900 group-hover:text-[#359EFF] transition-colors">
                                            {topic.tag}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">{topic.posts} posts</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                    <Link
                        to="/explore"
                        className="block mt-3 text-sm text-[#359EFF] hover:underline text-center"
                    >
                        Show More
                    </Link>
                </div>

                {/* Suggested Users */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Suggested Users</h3>
                    {isLoading ? (
                        <div className="flex justify-center py-4">
                            <LoadingSpinner size="sm" />
                        </div>
                    ) : suggestedUsers && suggestedUsers.length > 0 ? (
                        <>
                            <div className="space-y-3">
                                {suggestedUsers.slice(0, 5).map((user) => {
                                    const isFollowing = user.is_following || false;
                                    const isPending = (followMutation.isPending && followMutation.variables === user.id) ||
                                                     (unfollowMutation.isPending && unfollowMutation.variables === user.id);
                                    
                                    return (
                                        <div
                                            key={user.id}
                                            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <Link
                                                to={`/profile/${user.username}`}
                                                className="flex items-center space-x-3 flex-1 min-w-0"
                                            >
                                                <Avatar src={user.profile_picture} alt={user.name} size="md" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                                                    <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                                                </div>
                                            </Link>
                                            <Button
                                                size="sm"
                                                variant={isFollowing ? "outline" : "primary"}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleFollow(user.id, isFollowing);
                                                }}
                                                disabled={isPending}
                                                loading={isPending}
                                            >
                                                {isFollowing ? 'Connected' : 'Connect'}
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                            <Link
                                to="/explore"
                                className="block mt-3 text-sm text-[#359EFF] hover:underline text-center"
                            >
                                View All
                            </Link>
                        </>
                    ) : (
                        <div className="text-center py-4">
                            <p className="text-sm text-gray-500">No suggestions available</p>
                        </div>
                    )}
                </div>

                {/* Suggested Communities */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Suggested Communities</h3>
                    <div className="space-y-3">
                        {suggestedCommunities.map((community) => (
                            <div
                                key={community.id}
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center space-x-3 flex-1">
                                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                                        <span className="material-symbols-outlined text-gray-600">
                                            {community.icon}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900">{community.name}</p>
                                        <p className="text-xs text-gray-500">{community.members} members</p>
                                    </div>
                                </div>
                                <Button size="sm" variant="primary">
                                    Join
                                </Button>
                            </div>
                        ))}
                    </div>
                    <Link
                        to="/communities"
                        className="block mt-3 text-sm text-[#359EFF] hover:underline text-center"
                    >
                        View All
                    </Link>
                </div>
            </div>
        </aside>
    );
};

export default RightSidebar;
