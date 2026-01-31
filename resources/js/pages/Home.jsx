import React, { useRef, useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFeed } from '../hooks/usePosts';
import PostInput from '../components/posts/PostInput';
import PostCard from '../components/posts/PostCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Home = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('for-you');
    const [searchQuery, setSearchQuery] = useState('');
    const postInputRef = useRef(null);
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
    } = useFeed();

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

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

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
        <div className="max-w-2xl mx-auto">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mb-4">
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        search
                    </span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for creators, inspirations, and projects"
                        className="w-full pl-12 pr-4 py-3 theme-surface border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent"
                    />
                </div>
            </form>

            {/* Feed Tabs */}
            <div className="theme-surface rounded-xl border border-gray-700/50 mb-4 overflow-hidden">
                <div className="flex">
                    <button
                        onClick={() => setActiveTab('for-you')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'for-you'
                                ? 'bg-[var(--theme-accent)]/20 text-[var(--theme-accent)] border-b-2 border-[var(--theme-accent)]'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        For You
                    </button>
                    <button
                        onClick={() => setActiveTab('following')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'following'
                                ? 'bg-[var(--theme-accent)]/20 text-[var(--theme-accent)] border-b-2 border-[var(--theme-accent)]'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        Following
                    </button>
                    <button
                        onClick={() => setActiveTab('recent')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'recent'
                                ? 'bg-[var(--theme-accent)]/20 text-[var(--theme-accent)] border-b-2 border-[var(--theme-accent)]'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        Recent
                    </button>
                </div>
            </div>

            <div ref={postInputRef}>
                <PostInput />
            </div>
            <div className="space-y-4">
                {posts.length === 0 ? (
                    <div className="text-center py-12 theme-surface rounded-xl border border-gray-700/50">
                        <p className="text-gray-400">No posts yet. Start following people to see their posts!</p>
                    </div>
                ) : (
                    posts.map((post, index) => {
                        if (posts.length === index + 1) {
                            return (
                                <div key={post.id} ref={lastPostElementRef}>
                                    <PostCard post={post} onCommentClick={() => {}} />
                                </div>
                            );
                        }
                        return <PostCard key={post.id} post={post} onCommentClick={() => {}} />;
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
