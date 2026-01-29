import React, { useRef, useCallback, useState } from 'react';
import { useFeed } from '../hooks/usePosts';
import PostInput from '../components/posts/PostInput';
import PostCard from '../components/posts/PostCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Home = () => {
    const [activeTab, setActiveTab] = useState('for-you');
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
    } = useFeed();

    const observer = useRef();
    const lastPostElementRef = useCallback(
        (node) => {
            if (isLoading) return;
            if (observer.current) observer.current.disconnect();
            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            });
            if (node) observer.current.observe(node);
        },
        [isLoading, hasNextPage, isFetchingNextPage, fetchNextPage]
    );

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
                <p className="text-red-600">Failed to load posts. Please try again.</p>
            </div>
        );
    }

    // API may return posts as array or as { data: [...] } (Laravel resource collection)
    const posts =
        data?.pages.flatMap((page) => {
            const raw = page.data?.posts;
            return Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
        }) || [];

    return (
        <div className="max-w-2xl mx-auto">
            {/* Feed Tabs */}
            <div className="bg-white rounded-lg border border-gray-200 mb-4">
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('for-you')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'for-you'
                                ? 'bg-blue-50 text-[#359EFF] border-b-2 border-[#359EFF]'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                    >
                        For You
                    </button>
                    <button
                        onClick={() => setActiveTab('following')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'following'
                                ? 'bg-blue-50 text-[#359EFF] border-b-2 border-[#359EFF]'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                    >
                        Following
                    </button>
                    <button
                        onClick={() => setActiveTab('recent')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'recent'
                                ? 'bg-blue-50 text-[#359EFF] border-b-2 border-[#359EFF]'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                    >
                        Recent
                    </button>
                </div>
            </div>

            <PostInput />
            <div className="space-y-4">
                {posts.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                        <p className="text-gray-500">No posts yet. Start following people to see their posts!</p>
                    </div>
                ) : (
                    posts.map((post, index) => {
                        if (posts.length === index + 1) {
                            return (
                                <div key={post.id} ref={lastPostElementRef}>
                                    <PostCard post={post} />
                                </div>
                            );
                        }
                        return <PostCard key={post.id} post={post} />;
                    })
                )}
                {isFetchingNextPage && (
                    <div className="flex justify-center py-4">
                        <LoadingSpinner />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;
