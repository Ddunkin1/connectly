import React, { useRef, useCallback, useState, useEffect } from 'react';
import { useFeed, useSuggestedPosts } from '../hooks/usePosts';
import PostInput from '../components/posts/PostInput';
import StoriesRow from '../components/feed/StoriesRow';
import PostCard from '../components/posts/PostCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Home = () => {
    const [activeTab, setActiveTab] = useState('for-you');
    const postInputRef = useRef(null);
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
    } = useFeed();
    const { data: suggestedPosts = [] } = useSuggestedPosts();

    useEffect(() => {
        const handler = () => {
            postInputRef.current?.scrollIntoView?.({ behavior: 'smooth' });
        };
        window.addEventListener('open-create-post', handler);
        return () => window.removeEventListener('open-create-post', handler);
    }, []);

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
                <p className="text-red-500">Failed to load posts. Please try again.</p>
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
        <div className="w-full max-w-[720px]">
            <StoriesRow />
            {/* Feed Tabs */}
            <div className="theme-surface rounded-[16px] border border-[#2A2A2A] mb-6 overflow-hidden card-shadow">
                <div className="flex">
                    {['for-you', 'following', 'recent'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 px-4 py-4 text-sm font-medium transition-colors ${
                                activeTab === tab
                                    ? 'bg-[var(--theme-accent)]/20 text-[var(--theme-accent)] border-b-2 border-[var(--theme-accent)]'
                                    : 'text-[#9CA3AF] hover:text-white hover:bg-[#1E1E1E]'
                            }`}
                        >
                            {tab === 'for-you' ? 'For You' : tab === 'following' ? 'Following' : 'Recent'}
                        </button>
                    ))}
                </div>
            </div>

            <div ref={postInputRef}>
                <PostInput />
            </div>
            <div className="space-y-4 mt-4">
                {posts.length === 0 ? (
                    <div className="text-center py-12 theme-surface rounded-[16px] border border-[#2A2A2A]">
                        <p className="text-sm text-[#9CA3AF]">No posts yet. Start following people to see their posts!</p>
                    </div>
                ) : (
                    posts.map((post, index) => {
                        const isLast = posts.length === index + 1;
                        const showSuggestedAfter = index === 2 && suggestedPosts.length > 0;
                        return (
                            <React.Fragment key={post.id}>
                                {isLast ? (
                                    <div ref={lastPostElementRef}>
                                        <PostCard post={post} onCommentClick={() => {}} />
                                    </div>
                                ) : (
                                    <PostCard post={post} onCommentClick={() => {}} />
                                )}
                                {showSuggestedAfter && (
                                    <div className="mt-6">
                                        <p className="text-sm font-medium text-gray-400 mb-3 px-1">Suggested for you</p>
                                        <div className="space-y-4">
                                            {suggestedPosts.map((sp) => (
                                                <PostCard key={sp.id} post={sp} onCommentClick={() => {}} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })
                )}
                {isFetchingNextPage && (
                    <div className="flex justify-center py-2">
                        <LoadingSpinner />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;
