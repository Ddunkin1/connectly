import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { trendingAPI, userAPI, communityAPI } from '../services/api';
import PostCard from '../components/posts/PostCard';
import Avatar from '../components/common/Avatar';
import { FeedSkeleton } from '../components/common/skeletons';
import { Link } from 'react-router-dom';

const SECTION_TITLE = 'text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]';
const LINK_MUTED = 'text-xs text-[var(--theme-accent)] hover:underline';

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
        <div className="max-w-3xl mx-auto py-6 px-1">
            {/* Page header */}
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Explore</h1>
                <p className="text-sm text-[var(--text-secondary)]">
                    Discover posts, people, and communities tailored for you.
                </p>
            </header>

            {anyLoading && (
                <div className="py-4">
                    <FeedSkeleton cards={3} showComposer={false} />
                </div>
            )}

            {!anyLoading && (
                <div className="space-y-10">
                    {/* 1. Trending posts — primary content */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className={SECTION_TITLE}>Trending posts</h2>
                            <Link to="/search" className={LINK_MUTED}>
                                Open search
                            </Link>
                        </div>
                        {trendingPosts.length === 0 ? (
                            <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-8 text-center">
                                <span className="material-symbols-outlined text-4xl text-[var(--text-secondary)]/60 mb-3 block">trending_up</span>
                                <p className="text-sm text-[var(--text-secondary)] mb-2">No trending posts yet</p>
                                <p className="text-xs text-[var(--text-secondary)]/80">Create and engage with posts to see what’s rising.</p>
                                <Link to="/home" className="text-xs text-[var(--theme-accent)] hover:underline mt-2 inline-block">Go to Home</Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {trendingPosts.map((post) => (
                                    <PostCard key={post.id} post={post} />
                                ))}
                            </div>
                        )}
                    </section>

                    {/* 2. Suggested people */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className={SECTION_TITLE}>Suggested people</h2>
                            <Link to="/connections" className={LINK_MUTED}>
                                View connections
                            </Link>
                        </div>
                        <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4">
                            {suggestedUsers.length === 0 ? (
                                <div className="py-4 text-center">
                                    <p className="text-sm text-[var(--text-secondary)]">You’re connected with many people.</p>
                                    <Link to="/search" className="text-xs text-[var(--theme-accent)] hover:underline mt-1 inline-block">Find more in Search</Link>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-3">
                                    {suggestedUsers.slice(0, 6).map((u) => (
                                        <Link
                                            key={u.id}
                                            to={`/profile/${u.username}`}
                                            className="flex items-center gap-3 min-w-0 p-2.5 rounded-xl hover:bg-[var(--theme-surface-hover)] transition-colors w-full sm:w-auto sm:min-w-[200px]"
                                        >
                                            <Avatar src={u.profile_picture} alt={u.name} size="sm" className="w-10 h-10 rounded-full shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{u.name}</p>
                                                <p className="text-xs text-[var(--text-secondary)] truncate">@{u.username}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* 3. Communities to join */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className={SECTION_TITLE}>Communities to join</h2>
                            <Link to="/communities" className={LINK_MUTED}>
                                View all
                            </Link>
                        </div>
                        <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4">
                            {communities.length === 0 ? (
                                <div className="py-4 text-center">
                                    <p className="text-sm text-[var(--text-secondary)]">No communities available yet.</p>
                                    <Link to="/communities" className="text-xs text-[var(--theme-accent)] hover:underline mt-1 inline-block">Browse communities</Link>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-3">
                                    {communities.slice(0, 4).map((community) => (
                                        <Link
                                            key={community.id}
                                            to={`/communities/${community.id}`}
                                            className="flex items-center gap-3 min-w-0 p-2.5 rounded-xl hover:bg-[var(--theme-surface-hover)] transition-colors w-full sm:w-auto sm:min-w-[180px]"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-[var(--theme-surface-hover)] flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-lg text-[var(--text-secondary)]">group</span>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{community.name}</p>
                                                <p className="text-xs text-[var(--text-secondary)]">{community.members_count ?? 0} members</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* 4. Trending hashtags */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className={SECTION_TITLE}>Trending hashtags</h2>
                            <Link to="/search" className={LINK_MUTED}>
                                Search hashtags
                            </Link>
                        </div>
                        <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4">
                            {hashtags.length === 0 ? (
                                <div className="py-4 text-center">
                                    <p className="text-sm text-[var(--text-secondary)]">No trending hashtags right now.</p>
                                    <Link to="/search" className="text-xs text-[var(--theme-accent)] hover:underline mt-1 inline-block">Search hashtags</Link>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {hashtags.map((h) => (
                                        <Link
                                            key={h.id}
                                            to={`/hashtag/${encodeURIComponent(h.name)}`}
                                            className="px-3 py-1.5 rounded-full bg-[var(--theme-surface-hover)] text-xs text-[var(--text-primary)] hover:bg-[var(--theme-border)]/50 transition-colors"
                                        >
                                            #{h.name}
                                            {h.posts_count != null && (
                                                <span className="text-[var(--text-secondary)] ml-1">({h.posts_count})</span>
                                            )}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
};

export default Explore;
