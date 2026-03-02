import React, { useRef, useCallback, useEffect } from 'react';
import { useFeed, useSuggestedPosts } from '../hooks/usePosts';
import PostInput from '../components/posts/PostInput';
import StoriesRow from '../components/feed/StoriesRow';
import PostCard from '../components/posts/PostCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import OnboardingChecklistCard from '../components/onboarding/OnboardingChecklistCard';

const Home = () => {
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
        <div className="w-full">
            <div className="mb-6">
                <StoriesRow />
            </div>
            <OnboardingChecklistCard />

            {/* Post creator - "What's on your mind?" pattern in card */}
            <div ref={postInputRef}>
                <PostInput />
            </div>
            <div className="space-y-5 pt-5">
                {posts.length === 0 ? (
                    <div className="text-center py-12 glass-effect rounded-2xl">
                        <p className="text-sm text-slate-500">No posts yet. Start following people to see their posts!</p>
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
                                    <>
                                    <div className="flex items-center gap-3 px-2 py-2">
                                        <div className="h-px flex-1 bg-white/10" />
                                        <span className="text-[10px] uppercase font-bold text-slate-600 tracking-widest">Suggested for you</span>
                                        <div className="h-px flex-1 bg-white/10" />
                                    </div>
                                    <div className="glass-effect rounded-2xl p-6 shadow-xl">
                                        <p className="text-sm font-semibold mb-4 text-slate-100">Suggested for you</p>
                                        <div className="space-y-6">
                                            {suggestedPosts.map((sp) => (
                                                <PostCard key={sp.id} post={sp} onCommentClick={() => {}} />
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
                    <div className="flex justify-center py-2">
                        <LoadingSpinner />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;
