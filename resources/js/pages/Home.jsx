import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFeed, useSuggestedPosts } from '../hooks/usePosts';
import PostInput from '../components/posts/PostInput';
import PostCard from '../components/posts/PostCard';
import { FeedSkeleton, SkeletonBlock } from '../components/common/skeletons';
import OnboardingChecklistCard from '../components/onboarding/OnboardingChecklistCard';
import StoriesRow from '../components/feed/StoriesRow';

const FEED_SORT_KEY = 'connectly_feed_sort';

const Home = () => {
    const postInputRef = useRef(null);
    const [sort, setSort] = useState(() => {
        const saved = localStorage.getItem(FEED_SORT_KEY);
        return saved === 'recent' ? 'recent' : 'for_you';
    });

    const handleSortChange = (newSort) => {
        setSort(newSort);
        localStorage.setItem(FEED_SORT_KEY, newSort);
    };

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
    } = useFeed(sort);
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
        return <FeedSkeleton cards={4} showComposer />;
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
        <div className="max-w-[680px] mx-auto w-full space-y-6">
            {/* Main content + right column */}
            <div className="flex gap-8 xl:gap-10 items-start">
                {/* Center column */}
                <div className="flex-1 min-w-0 space-y-6">
                    {/* Stories */}
                    <StoriesRow />

                    {/* Onboarding */}
                    <div className="space-y-4">
                        <OnboardingChecklistCard />
                    </div>

                    {/* Feed sort toggle */}
                    <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl w-fit">
                        <button
                            type="button"
                            onClick={() => handleSortChange('for_you')}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                sort === 'for_you'
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            For You
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSortChange('recent')}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                sort === 'recent'
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Recent
                        </button>
                    </div>

                    {/* Post composer */}
                    <div ref={postInputRef}>
                        <PostInput />
                    </div>

                    {/* Feed - single column list */}
                    <div className="space-y-5">
                        {posts.length === 0 ? (
                            <div className="text-center py-14 glass-effect rounded-2xl">
                                <span className="material-symbols-outlined text-5xl text-slate-600 mb-4 block">feed</span>
                                <p className="text-base font-medium text-slate-300 mb-1">Your feed is empty</p>
                                <p className="text-sm text-slate-500 max-w-xs mx-auto mb-6">
                                    Follow people or join communities to see posts here.
                                </p>
                                <div className="flex items-center justify-center gap-3">
                                    <Link
                                        to="/search"
                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">person_search</span>
                                        Find people
                                    </Link>
                                    <Link
                                        to="/explore"
                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/5 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">explore</span>
                                        Explore
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            posts.map((post, index) => {
                                const isLast = posts.length === index + 1;
                                const showSuggestedAfter = index === 2 && suggestedPosts.length > 0;
                                return (
                                    <React.Fragment key={post.id}>
                                        {isLast ? (
                                            <div ref={lastPostElementRef}>
                                                <PostCard post={post} />
                                            </div>
                                        ) : (
                                            <PostCard post={post} />
                                        )}
                                        {showSuggestedAfter && (
                                            <>
                                                <div className="flex items-center gap-3 px-2 py-2">
                                                    <div className="h-px flex-1 bg-white/10" />
                                                    <span className="text-[10px] uppercase font-bold text-slate-600 tracking-widest">
                                                        Suggested for you
                                                    </span>
                                                    <div className="h-px flex-1 bg-white/10" />
                                                </div>
                                                <div className="glass-effect rounded-2xl p-6 shadow-xl">
                                                    <p className="text-sm font-semibold mb-4 text-slate-100">
                                                        Suggested for you
                                                    </p>
                                                    <div className="space-y-6">
                                                        {suggestedPosts.map((sp) => (
                                                            <PostCard key={sp.id} post={sp} />
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        )}
                        {isFetchingNextPage && (
                            <div className="flex justify-center py-4">
                                <SkeletonBlock className="h-8 w-8 rounded-full" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
