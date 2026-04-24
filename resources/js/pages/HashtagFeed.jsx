import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { trendingAPI } from '../services/api';
import PostCard from '../components/posts/PostCard';
import { FeedSkeleton } from '../components/common/skeletons';

const HashtagFeed = () => {
    const { tag } = useParams();
    const [page, setPage] = useState(1);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['hashtag-posts', tag, page],
        queryFn: () => trendingAPI.getHashtagPosts(tag, page),
        select: (res) => res.data,
        enabled: !!tag,
        keepPreviousData: true,
    });

    const posts = data?.posts ?? [];
    const total = data?.total ?? 0;
    const lastPage = data?.last_page ?? 1;
    const hashtagName = data?.hashtag?.name ?? tag;

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <Link
                    to="/explore"
                    className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4"
                >
                    <span className="material-symbols-outlined text-base">arrow_back</span>
                    Explore
                </Link>
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                    #{hashtagName}
                </h1>
                {total > 0 && (
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                        {total} public {total === 1 ? 'post' : 'posts'}
                    </p>
                )}
            </div>

            {isLoading ? (
                <FeedSkeleton />
            ) : isError ? (
                <div className="text-center py-12 text-[var(--text-secondary)]">
                    <span className="material-symbols-outlined text-4xl mb-2 block">error_outline</span>
                    Failed to load posts. Try again later.
                </div>
            ) : posts.length === 0 ? (
                <div className="text-center py-16 text-[var(--text-secondary)]">
                    <span className="material-symbols-outlined text-5xl mb-3 block opacity-40">tag</span>
                    <p className="text-lg font-medium text-[var(--text-primary)]">No posts yet</p>
                    <p className="text-sm mt-1">Be the first to post with #{hashtagName}</p>
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        {posts.map((post) => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>

                    {lastPage > 1 && (
                        <div className="flex justify-center gap-3 mt-8 pb-8">
                            <button
                                type="button"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--theme-surface)] text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] disabled:opacity-40 transition-colors"
                            >
                                Previous
                            </button>
                            <span className="px-4 py-2 text-sm text-[var(--text-secondary)]">
                                {page} / {lastPage}
                            </span>
                            <button
                                type="button"
                                onClick={() => setPage((p) => p + 1)}
                                disabled={page >= lastPage}
                                className="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--theme-surface)] text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] disabled:opacity-40 transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default HashtagFeed;
