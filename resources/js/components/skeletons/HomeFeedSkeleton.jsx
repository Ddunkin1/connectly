import React from 'react';
import Skeleton from '../common/Skeleton';
import PostCardSkeleton from './PostCardSkeleton';

function StoriesRowSkeleton() {
    return (
        <div className="flex gap-3 overflow-x-auto pt-4 pb-3 scrollbar-hide h-[88px] items-end mt-1">
            {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center space-y-2 flex-shrink-0">
                    <Skeleton className="w-14 h-14 rounded-xl" rounded="rounded-xl" />
                    <Skeleton className="h-2.5 w-12" />
                </div>
            ))}
        </div>
    );
}

function OnboardingChecklistSkeleton() {
    return (
        <div className="mb-6 theme-surface rounded-xl p-6 border border-white/5 shadow-lg">
            <div className="flex items-center justify-between mb-4 gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-4 w-72 max-w-[60vw]" />
                </div>
                <div className="flex items-center gap-2.5">
                    <Skeleton className="h-3 w-8" />
                    <Skeleton className="w-28 h-1.5 rounded-full" rounded="rounded-full" />
                </div>
            </div>
            <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3">
                        <Skeleton className="w-[18px] h-[18px] rounded-full mt-[2px]" rounded="rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-3 w-[65%]" />
                            <Skeleton className="h-3 w-[45%]" />
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-4 flex justify-end">
                <Skeleton className="h-3 w-32" />
            </div>
        </div>
    );
}

function PostComposerSkeleton() {
    return (
        <div className="theme-surface rounded-2xl border border-white/5 shadow-lg p-4 md:p-5">
            <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" rounded="rounded-full" />
                <Skeleton className="h-10 flex-1 rounded-full" rounded="rounded-full" />
                <Skeleton className="h-10 w-20 rounded-full" rounded="rounded-full" />
            </div>
            <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-24 rounded-full" rounded="rounded-full" />
                    <Skeleton className="h-9 w-24 rounded-full" rounded="rounded-full" />
                    <Skeleton className="h-9 w-24 rounded-full" rounded="rounded-full" />
                </div>
                <Skeleton className="h-9 w-16 rounded-full" rounded="rounded-full" />
            </div>
        </div>
    );
}

export default function HomeFeedSkeleton() {
    return (
        <div className="w-full space-y-6" aria-busy="true">
            <div className="flex gap-8 xl:gap-10 items-start">
                <div className="flex-1 min-w-0 space-y-6">
                    <div className="space-y-4">
                        <StoriesRowSkeleton />
                        <OnboardingChecklistSkeleton />
                    </div>
                    <PostComposerSkeleton />
                    <div className="space-y-5">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <PostCardSkeleton key={i} compact={i > 1} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

