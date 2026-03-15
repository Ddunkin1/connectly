import React from 'react';
import Skeleton from '../common/Skeleton';
import PostCardSkeleton from './PostCardSkeleton';
import ListItemSkeleton from './ListItemSkeleton';

export default function ExploreSkeleton() {
    return (
        <div className="max-w-5xl mx-auto py-6" aria-busy="true">
            <div className="mb-6 space-y-2">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-4 w-[70%] max-w-[520px]" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <PostCardSkeleton key={i} compact={i > 0} />
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="theme-surface rounded-2xl border border-white/5 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <Skeleton className="h-4 w-36" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                        <div className="space-y-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <ListItemSkeleton key={i} />
                            ))}
                        </div>
                    </div>

                    <div className="theme-surface rounded-2xl border border-white/5 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                        <div className="space-y-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="flex items-center justify-between gap-3">
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-3 w-40" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                    <Skeleton className="h-7 w-16 rounded-full" rounded="rounded-full" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="theme-surface rounded-2xl border border-white/5 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <Skeleton key={i} className="h-8 w-24 rounded-full" rounded="rounded-full" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

