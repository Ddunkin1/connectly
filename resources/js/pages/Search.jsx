import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useSearch } from '../hooks/useSearch';
import PostCard from '../components/posts/PostCard';
import Avatar from '../components/common/Avatar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useFollow, useUnfollow } from '../hooks/useUsers';
import useAuthStore from '../store/authStore';

const Search = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [activeTab, setActiveTab] = useState('all');
    const user = useAuthStore((state) => state.user);
    const followMutation = useFollow();
    const unfollowMutation = useUnfollow();

    const { data, isLoading, isError } = useSearch(query, activeTab, !!query);

    const handleFollow = (userId) => {
        followMutation.mutate(userId);
    };

    const handleUnfollow = (userId) => {
        unfollowMutation.mutate(userId);
    };

    const tabs = [
        { id: 'all', label: 'All' },
        { id: 'users', label: 'Users' },
        { id: 'posts', label: 'Posts' },
        { id: 'communities', label: 'Communities' },
    ];

    if (!query) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="bg-[#252538] rounded-xl border border-gray-700/50 p-8 text-center">
                    <span className="material-symbols-outlined text-6xl text-gray-500 mb-4">
                        search
                    </span>
                    <h2 className="text-xl font-semibold text-white mb-2">Search connectly</h2>
                    <p className="text-gray-400">Enter a search query to find users, posts, and communities</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-12">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600">Failed to load search results. Please try again.</p>
            </div>
        );
    }

    const results = data?.data || {};
    const users = Array.isArray(results.users) ? results.users : [];
    const posts = Array.isArray(results.posts) ? results.posts : [];
    const communities = Array.isArray(results.communities) ? results.communities : [];
    const hashtags = Array.isArray(results.hashtags) ? results.hashtags : [];

    const renderUsers = () => {
        if (users.length === 0) {
            return (
                <div className="text-center py-8 text-gray-500">
                    <p>No users found</p>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {users.map((userResult) => (
                    <div
                        key={userResult.id}
                        className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between"
                    >
                        <Link
                            to={`/profile/${userResult.username}`}
                            className="flex items-center space-x-3 flex-1 hover:opacity-80"
                        >
                            <Avatar src={userResult.profile_picture} alt={userResult.name} size="md" />
                            <div>
                                <p className="font-semibold text-gray-900">{userResult.name}</p>
                                <p className="text-sm text-gray-500">@{userResult.username}</p>
                                {userResult.bio && (
                                    <p className="text-sm text-gray-600 mt-1">{userResult.bio}</p>
                                )}
                                <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                                    <span>{userResult.followers_count || 0} followers</span>
                                    <span>{userResult.following_count || 0} following</span>
                                </div>
                            </div>
                        </Link>
                        {userResult.id !== user?.id && (
                            <div className="flex items-center gap-2">
                                {userResult.is_following ? (
                                    <>
                                        <span className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-lg">
                                            <span className="material-symbols-outlined text-lg">check_circle</span>
                                            Connected
                                        </span>
                                        <button
                                            onClick={() => handleUnfollow(userResult.id)}
                                            className="px-4 py-2 rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                                        >
                                            Unfollow
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => handleFollow(userResult.id)}
                                        className="px-4 py-2 rounded-lg font-medium bg-[#359EFF] text-white hover:bg-[#2a8eef] transition-colors"
                                    >
                                        Connect
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    const renderPosts = () => {
        if (posts.length === 0) {
            return (
                <div className="text-center py-8 text-gray-500">
                    <p>No posts found</p>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                ))}
            </div>
        );
    };

    const renderCommunities = () => {
        if (communities.length === 0) {
            return (
                <div className="text-center py-8 text-gray-500">
                    <p>No communities found</p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {communities.map((community) => (
                    <Link
                        key={community.id}
                        to={`/communities/${community.id}`}
                        className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-start space-x-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                <span className="material-symbols-outlined text-gray-600">
                                    group
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 mb-1">{community.name}</h3>
                                {community.description && (
                                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                        {community.description}
                                    </p>
                                )}
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                    <span>{community.members_count || 0} members</span>
                                    <span className="capitalize">{community.privacy}</span>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        );
    };

    const renderHashtags = () => {
        if (hashtags.length === 0) {
            return (
                <div className="text-center py-8 text-gray-500">
                    <p>No hashtags found</p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hashtags.map((hashtag) => (
                    <Link
                        key={hashtag.id}
                        to={`/hashtag/${hashtag.name.replace('#', '')}`}
                        className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                    >
                        <p className="font-semibold text-[#359EFF] text-lg mb-1">
                            {hashtag.name.startsWith('#') ? hashtag.name : `#${hashtag.name}`}
                        </p>
                        <p className="text-sm text-gray-500">{hashtag.posts_count || 0} posts</p>
                    </Link>
                ))}
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Search Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Search results for "{query}"
                </h1>
                <p className="text-gray-500">
                    Found {users.length + posts.length + communities.length + hashtags.length} results
                </p>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg border border-gray-200 mb-6">
                <div className="flex border-b border-gray-200">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                                activeTab === tab.id
                                    ? 'bg-blue-50 text-[#359EFF] border-b-2 border-[#359EFF]'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results */}
            <div>
                {activeTab === 'all' && (
                    <div className="space-y-8">
                        {users.length > 0 && (
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Users</h2>
                                {renderUsers()}
                            </div>
                        )}
                        {posts.length > 0 && (
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Posts</h2>
                                {renderPosts()}
                            </div>
                        )}
                        {communities.length > 0 && (
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Communities</h2>
                                {renderCommunities()}
                            </div>
                        )}
                        {hashtags.length > 0 && (
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Hashtags</h2>
                                {renderHashtags()}
                            </div>
                        )}
                        {users.length === 0 && posts.length === 0 && communities.length === 0 && hashtags.length === 0 && (
                            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                                <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">
                                    search_off
                                </span>
                                <p className="text-gray-500">No results found</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'users' && renderUsers()}
                {activeTab === 'posts' && renderPosts()}
                {activeTab === 'communities' && renderCommunities()}
                {activeTab === 'hashtags' && renderHashtags()}
            </div>
        </div>
    );
};

export default Search;
