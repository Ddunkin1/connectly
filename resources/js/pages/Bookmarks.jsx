import React from 'react';
import { useBookmarks } from '../hooks/useBookmarks';
import PostCard from '../components/posts/PostCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Bookmarks = () => {
    const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useBookmarks();

    const posts = data?.pages?.flatMap((page) => page?.data?.posts ?? []) ?? [];

    if (isLoading) {
        return (
            <div className="max-w-2xl mx-auto py-8">
                <h1 className="text-2xl font-bold text-white mb-4">Bookmarks</h1>
                <div className="flex justify-center py-12">
                    <LoadingSpinner />
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="max-w-2xl mx-auto py-8">
                <h1 className="text-2xl font-bold text-white mb-4">Bookmarks</h1>
                <div className="bg-[#252538] rounded-xl p-8 text-center text-gray-400">
                    <p>Failed to load bookmarks.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-8">
            <h1 className="text-2xl font-bold text-white mb-4">Bookmarks</h1>
            {posts.length === 0 ? (
                <div className="bg-[#252538] rounded-xl p-8 text-center text-gray-400">
                    <p>No saved posts yet.</p>
                    <p className="text-sm mt-2">Save posts by clicking the bookmark icon on any post.</p>
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        {posts.map((post) => (
                            <PostCard
                                key={post.id}
                                post={post}
                                onDeleted={() => {}}
                                onCommentClick={null}
                            />
                        ))}
                    </div>
                    {hasNextPage && (
                        <div className="mt-6 flex justify-center">
                            <button
                                type="button"
                                onClick={() => fetchNextPage()}
                                disabled={isFetchingNextPage}
                                className="px-4 py-2 rounded-lg bg-[#252538] text-white hover:bg-[#2d2d42] disabled:opacity-60"
                            >
                                {isFetchingNextPage ? 'Loading...' : 'Load more'}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Bookmarks;
