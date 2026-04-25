import React from 'react';
import { Link } from 'react-router-dom';
import { useBookmarks } from '../hooks/useBookmarks';
import PostCard from '../components/posts/PostCard';
import { FeedSkeleton } from '../components/common/skeletons';

const Bookmarks = () => {
    const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useBookmarks();

    const posts = data?.pages?.flatMap((page) => page?.data?.posts ?? []) ?? [];

    if (isLoading) {
        return (
            <div className="max-w-[680px] mx-auto w-full py-8">
                <header className="mb-8">
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Bookmarks</h1>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">Posts you saved for later</p>
                </header>
                <FeedSkeleton cards={4} showComposer={false} />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="max-w-[680px] mx-auto w-full py-8">
                <header className="mb-8">
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Bookmarks</h1>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">Posts you saved for later</p>
                </header>
                <div className="rounded-2xl border border-red-200 bg-red-500/10 p-6 text-center">
                    <p className="text-red-400 font-medium">Failed to load bookmarks.</p>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">Please try again later.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[680px] mx-auto w-full py-6 px-1">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">Bookmarks</h1>
                <p className="text-sm text-[var(--text-secondary)] mt-1">Posts you saved for later</p>
            </header>

            {posts.length === 0 ? (
                <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-10 text-center shadow-post-card">
                    <span className="material-symbols-outlined text-5xl text-[var(--text-secondary)]/50 mb-4 block">bookmark</span>
                    <p className="text-[var(--text-primary)] font-medium">No saved posts yet</p>
                    <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-sm mx-auto">
                        Save posts by clicking the bookmark icon on any post. They’ll show up here.
                    </p>
                    <Link
                        to="/explore"
                        className="inline-flex items-center gap-2 mt-6 text-sm font-medium text-[var(--theme-accent)] hover:underline"
                    >
                        <span>Explore posts</span>
                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </Link>
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        {posts.map((post) => (
                            <PostCard
                                key={post.id}
                                post={post}
                                onDeleted={() => {}}
                            />
                        ))}
                    </div>
                    {hasNextPage && (
                        <div className="mt-6 flex justify-center">
                            <button
                                type="button"
                                onClick={() => fetchNextPage()}
                                disabled={isFetchingNextPage}
                                className="px-5 py-2.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] disabled:opacity-60 transition-colors font-medium"
                            >
                                {isFetchingNextPage ? 'Loading…' : 'Load more'}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Bookmarks;
