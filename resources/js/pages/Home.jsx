import React, { useRef, useCallback } from 'react';
import { useFeed } from '../hooks/usePosts';
import PostInput from '../components/posts/PostInput';
import PostCard from '../components/posts/PostCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Home = () => {
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

    const posts = data?.pages.flatMap((page) => page.data.posts) || [];

    return (
        <div className="max-w-2xl mx-auto">
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
