import React from 'react';
import Skeleton from '../common/Skeleton';
import PostCardSkeleton from './PostCardSkeleton';

export default function ProfileSkeleton() {
    return (
        <div className="max-w-[1400px] mx-auto" aria-busy="true">
            <div className="theme-surface rounded-2xl overflow-hidden mb-6 border border-[#2A2A2A] card-shadow relative">
                <div className="h-64 relative overflow-hidden">
                    <Skeleton className="absolute inset-0 w-full h-full" rounded="rounded-none" />
                </div>

                <div className="absolute top-44 left-6 md:left-10 z-20">
                    <div className="w-40 h-40 rounded-full border-4 border-[var(--theme-surface)] p-1 theme-surface bg-[var(--theme-surface)] overflow-hidden shadow-inner">
                        <Skeleton className="w-full h-full rounded-full" rounded="rounded-full" />
                    </div>
                </div>

                <div className="pt-20 md:pt-24 pb-8 px-6 md:px-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6">
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-56 max-w-[70vw]" />
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-4 w-64 max-w-[75vw]" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-10 w-28 rounded-full" rounded="rounded-full" />
                            <Skeleton className="h-10 w-28 rounded-full" rounded="rounded-full" />
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-3 gap-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="theme-surface rounded-xl border border-white/5 p-4">
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="mt-2 h-6 w-20" />
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex items-center gap-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-8 w-20 rounded-full" rounded="rounded-full" />
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-5">
                {Array.from({ length: 3 }).map((_, i) => (
                    <PostCardSkeleton key={i} compact={i > 0} />
                ))}
            </div>
        </div>
    );
}

