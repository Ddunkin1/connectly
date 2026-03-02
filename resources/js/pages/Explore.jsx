import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { trendingAPI, userAPI, communityAPI } from '../services/api';
import PostCard from '../components/posts/PostCard';
import Avatar from '../components/common/Avatar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Link } from 'react-router-dom';

const Explore = () => {
    const { data: trendingPostsRes, isLoading: loadingPosts } = useQuery({
        queryKey: ['explore-trending-posts'],
        queryFn: () => trendingAPI.getPosts({ limit: 5 }),
        select: (res) => res.data?.posts ?? [],
    });

    const { data: suggestedUsersRes, isLoading: loadingUsers } = useQuery({
        queryKey: ['explore-suggested-users'],
        queryFn: () => userAPI.getSuggested(),
        select: (res) => res.data?.users ?? [],
    });

    const { data: communitiesRes, isLoading: loadingCommunities } = useQuery({
        queryKey: ['explore-communities'],
        queryFn: () => communityAPI.getAll({ limit: 6 }),
        select: (res) => res.data?.communities ?? [],
    });

    const { data: hashtagsRes, isLoading: loadingHashtags } = useQuery({
        queryKey: ['explore-trending-hashtags'],
        queryFn: () => trendingAPI.getHashtags({ limit: 8 }),
        select: (res) => res.data?.hashtags ?? [],
    });

    const trendingPosts = trendingPostsRes ?? [];
    const suggestedUsers = suggestedUsersRes ?? [];
    const communities = communitiesRes ?? [];
    const hashtags = hashtagsRes ?? [];

    const anyLoading = loadingPosts || loadingUsers || loadingCommunities || loadingHashtags;

    return (
        <div className="max-w-5xl mx-auto py-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white mb-1">Explore</h1>
                <p className="text-sm text-slate-400">
                    Discover new posts, people, communities, and topics tailored for you.
                </p>
            </div>

            {anyLoading && (
                <div className="flex justify-center py-8">
                    <LoadingSpinner size="lg" />
                </div>
            )}

            {!anyLoading && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main column: trending posts */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-[0.2em]">
                                Trending posts
                            </h2>
                            <Link
                                to="/search"
                                className="text-xs text-primary hover:underline"
                            >
                                Open full search
                            </Link>
                        </div>
                        {trendingPosts.length === 0 ? (
                            <p className="text-sm text-slate-500">
                                No trending posts yet. Start creating and engaging to see what rises.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {trendingPosts.map((post) => (
                                    <PostCard key={post.id} post={post} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right column: people, communities, hashtags */}
                    <div className="space-y-4">
                        <div className="theme-surface rounded-2xl border border-white/5 p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-sm font-semibold text-slate-200">
                                    Suggested people
                                </h2>
                                <Link
                                    to="/connections"
                                    className="text-[11px] text-primary hover:underline"
                                >
                                    View connections
                                </Link>
                            </div>
                            {suggestedUsers.length === 0 ? (
                                <p className="text-xs text-slate-500">
                                    You&apos;re already connected with many people. Find more in Search.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {suggestedUsers.slice(0, 5).map((u) => (
                                        <Link
                                            key={u.id}
                                            to={`/profile/${u.username}`}
                                            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5"
                                        >
                                            <Avatar
                                                src={u.profile_picture}
                                                alt={u.name}
                                                size="sm"
                                                className="w-8 h-8 rounded-full"
                                            />
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium text-slate-100 truncate">
                                                    {u.name}
                                                </p>
                                                <p className="text-[11px] text-slate-500 truncate">
                                                    @{u.username}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="theme-surface rounded-2xl border border-white/5 p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-sm font-semibold text-slate-200">
                                    Communities to join
                                </h2>
                                <Link
                                    to="/communities"
                                    className="text-[11px] text-primary hover:underline"
                                >
                                    View all
                                </Link>
                            </div>
                            {communities.length === 0 ? (
                                <p className="text-xs text-slate-500">
                                    No communities available yet. Check back soon.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {communities.slice(0, 4).map((community) => (
                                        <Link
                                            key={community.id}
                                            to={`/communities/${community.id}`}
                                            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-[16px] text-slate-300">
                                                    group
                                                </span>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium text-slate-100 truncate">
                                                    {community.name}
                                                </p>
                                                <p className="text-[11px] text-slate-500 truncate">
                                                    {community.members_count || 0} members
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="theme-surface rounded-2xl border border-white/5 p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-sm font-semibold text-slate-200">
                                    Trending hashtags
                                </h2>
                                <Link
                                    to="/search"
                                    className="text-[11px] text-primary hover:underline"
                                >
                                    Search hashtags
                                </Link>
                            </div>
                            {hashtags.length === 0 ? (
                                <p className="text-xs text-slate-500">
                                    No trending hashtags right now.
                                </p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {hashtags.map((h) => (
                                        <Link
                                            key={h.id}
                                            to={`/search?q=%23${encodeURIComponent(h.name)}&type=hashtags`}
                                            className="px-3 py-1.5 rounded-full bg-white/5 text-[11px] text-slate-100 hover:bg-white/10"
                                        >
                                            #{h.name}
                                            <span className="text-slate-500 ml-1">
                                                ({h.posts_count})
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Explore;

