import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { trendingAPI } from '../services/api';
import { useSearch } from '../hooks/useSearch';
import PostCard from '../components/posts/PostCard';
import Avatar from '../components/common/Avatar';
import { FeedSkeleton } from '../components/common/skeletons';
import { useFollow, useUnfollow } from '../hooks/useUsers';
import useAuthStore from '../store/authStore';

const Search = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [localQuery, setLocalQuery] = useState(query);
    const user = useAuthStore((state) => state.user);
    const followMutation = useFollow();
    const unfollowMutation = useUnfollow();

    useEffect(() => {
        setLocalQuery(query);
    }, [query]);

    const [activeTab, setActiveTab] = useState(() => {
        const t = searchParams.get('type');
        return t && ['users', 'posts', 'communities', 'hashtags'].includes(t) ? t : 'all';
    });

    const { data, isLoading, isError } = useSearch(query, activeTab, !!query);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        const q = localQuery.trim();
        if (q) setSearchParams({ q, ...(activeTab !== 'all' ? { type: activeTab } : {}) });
    };

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
        { id: 'hashtags', label: 'Hashtags' },
    ];

    const { data: trendingData } = useQuery({
        queryKey: ['trending-hashtags'],
        queryFn: () => trendingAPI.getHashtags({ limit: 10 }),
        select: (res) => res.data?.hashtags ?? [],
        enabled: !query,
    });
    const trendingHashtags = trendingData ?? [];

    if (!query) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="bg-[var(--theme-surface)] rounded-xl border border-[var(--theme-border)] p-6 sm:p-8 mb-6">
                    <form onSubmit={handleSearchSubmit} className="text-center">
                        <label htmlFor="search-main" className="sr-only">Search</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-xl pointer-events-none">search</span>
                            <input
                                id="search-main"
                                type="text"
                                value={localQuery}
                                onChange={(e) => setLocalQuery(e.target.value)}
                                placeholder="Search creators, communities, and topics..."
                                className="w-full bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] rounded-xl py-3 pl-12 pr-4 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:ring-2 focus:ring-[var(--theme-accent)]/40 focus:border-[var(--theme-accent)] outline-none transition-standard"
                                autoFocus
                            />
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] mt-3">Find users, posts, and communities</p>
                        <button
                            type="submit"
                            disabled={!localQuery.trim()}
                            className="mt-4 px-6 py-2.5 rounded-xl font-medium bg-[var(--theme-accent)] text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-standard"
                        >
                            Search
                        </button>
                    </form>
                </div>
                {trendingHashtags.length > 0 && (
                    <div className="bg-[var(--theme-surface)] rounded-xl border border-[var(--theme-border)] p-6">
                        <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-[0.2em] mb-4">Trending hashtags</h3>
                        <div className="flex flex-wrap gap-2">
                            {trendingHashtags.map((h) => (
                                <Link
                                    key={h.id}
                                    to={`/search?q=%23${encodeURIComponent(h.name)}&type=hashtags`}
                                    className="px-4 py-2 rounded-full bg-[var(--theme-surface-hover)] text-[var(--theme-accent)] hover:opacity-90 transition-standard"
                                >
                                    #{h.name} <span className="text-[var(--text-secondary)] text-sm">({h.posts_count})</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="max-w-2xl mx-auto py-4">
                <FeedSkeleton cards={3} showComposer={false} />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="text-center py-12">
                <p className="text-red-500 text-[var(--text-primary)]">Failed to load search results. Please try again.</p>
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
                <div className="text-center py-8 text-[var(--text-secondary)]">
                    <p>No users found</p>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {users.map((userResult) => (
                    <div
                        key={userResult.id}
                        className="bg-[var(--theme-surface)] rounded-xl border border-[var(--theme-border)] p-4 flex items-center justify-between gap-4"
                    >
                        <Link
                            to={`/profile/${userResult.username}`}
                            className="flex items-center space-x-3 flex-1 min-w-0 hover:opacity-90"
                        >
                            <Avatar src={userResult.profile_picture} alt={userResult.name} size="md" />
                            <div className="min-w-0">
                                <p className="font-semibold text-[var(--text-primary)]">{userResult.name}</p>
                                <p className="text-sm text-[var(--text-secondary)]">@{userResult.username}</p>
                                {userResult.bio && (
                                    <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">{userResult.bio}</p>
                                )}
                                <div className="flex items-center space-x-4 mt-1 text-xs text-[var(--text-secondary)]">
                                    <span>{userResult.followers_count || 0} followers</span>
                                    <span>{userResult.following_count || 0} following</span>
                                </div>
                            </div>
                        </Link>
                        {userResult.id !== user?.id && (
                            <div className="flex items-center gap-2 shrink-0">
                                {userResult.is_following ? (
                                    <>
                                        <span className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-600 bg-emerald-500/15 rounded-lg">
                                            <span className="material-symbols-outlined text-lg">check_circle</span>
                                            Connected
                                        </span>
                                        <button
                                            onClick={() => handleUnfollow(userResult.id)}
                                            className="px-4 py-2 rounded-lg font-medium bg-[var(--theme-surface-hover)] text-[var(--text-primary)] hover:opacity-90 transition-colors"
                                        >
                                            Unfollow
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => handleFollow(userResult.id)}
                                        className="px-4 py-2 rounded-lg font-medium bg-[var(--theme-accent)] text-white hover:opacity-90 transition-colors"
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
                <div className="text-center py-8 text-[var(--text-secondary)]">
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
                <div className="text-center py-8 text-[var(--text-secondary)]">
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
                        className="bg-[var(--theme-surface)] rounded-xl border border-[var(--theme-border)] p-4 hover:bg-[var(--theme-surface-hover)] transition-colors"
                    >
                        <div className="flex items-start space-x-3">
                            <div className="w-12 h-12 bg-[var(--theme-surface-hover)] rounded-xl flex items-center justify-center flex-shrink-0">
                                <span className="material-symbols-outlined text-[var(--text-secondary)]">
                                    group
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-[var(--text-primary)] mb-1">{community.name}</h3>
                                {community.description && (
                                    <p className="text-sm text-[var(--text-secondary)] mb-2 line-clamp-2">
                                        {community.description}
                                    </p>
                                )}
                                <div className="flex items-center space-x-4 text-xs text-[var(--text-secondary)]">
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
                <div className="text-center py-8 text-[var(--text-secondary)]">
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
                        className="bg-[var(--theme-surface)] rounded-xl border border-[var(--theme-border)] p-4 hover:bg-[var(--theme-surface-hover)] transition-colors"
                    >
                        <p className="font-semibold text-[var(--theme-accent)] text-lg mb-1">
                            {hashtag.name.startsWith('#') ? hashtag.name : `#${hashtag.name}`}
                        </p>
                        <p className="text-sm text-[var(--text-secondary)]">{hashtag.posts_count || 0} posts</p>
                    </Link>
                ))}
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Search bar - so you can refine search without going back to header */}
            <form onSubmit={handleSearchSubmit} className="mb-6">
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-xl pointer-events-none">search</span>
                    <input
                        type="text"
                        value={localQuery}
                        onChange={(e) => setLocalQuery(e.target.value)}
                        placeholder="Search creators, communities, and topics..."
                        className="w-full bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-xl py-2.5 pl-12 pr-4 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:ring-2 focus:ring-[var(--theme-accent)]/40 focus:border-[var(--theme-accent)] outline-none transition-standard"
                    />
                </div>
            </form>

            {/* Results header */}
            <div className="mb-4">
                <h1 className="text-xl font-bold text-[var(--text-primary)]">
                    Results for &ldquo;{query}&rdquo;
                </h1>
                <p className="text-sm text-[var(--text-secondary)]">
                    {users.length + posts.length + communities.length + hashtags.length} results
                </p>
            </div>

            {/* Tabs */}
            <div className="bg-[var(--theme-surface)] rounded-xl border border-[var(--theme-border)] mb-6 overflow-hidden">
                <div className="flex border-b border-[var(--theme-border)]">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                                activeTab === tab.id
                                    ? 'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border-b-2 border-[var(--theme-accent)]'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)]'
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
                                <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-[0.2em] mb-4">Users</h2>
                                {renderUsers()}
                            </div>
                        )}
                        {posts.length > 0 && (
                            <div>
                                <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-[0.2em] mb-4">Posts</h2>
                                {renderPosts()}
                            </div>
                        )}
                        {communities.length > 0 && (
                            <div>
                                <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-[0.2em] mb-4">Communities</h2>
                                {renderCommunities()}
                            </div>
                        )}
                        {hashtags.length > 0 && (
                            <div>
                                <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-[0.2em] mb-4">Hashtags</h2>
                                {renderHashtags()}
                            </div>
                        )}
                        {users.length === 0 && posts.length === 0 && communities.length === 0 && hashtags.length === 0 && (
                            <div className="text-center py-12 bg-[var(--theme-surface)] rounded-xl border border-[var(--theme-border)]">
                                <span className="material-symbols-outlined text-6xl text-[var(--text-secondary)]/50 mb-4 block">
                                    search_off
                                </span>
                                <p className="text-[var(--text-secondary)]">No results found</p>
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
