import React from 'react';
import Skeleton from '../common/Skeleton';
import ListItemSkeleton from './ListItemSkeleton';
import PostCardSkeleton from './PostCardSkeleton';

export default function SearchSkeleton() {
    return (
        <div className="max-w-4xl mx-auto" aria-busy="true">
            <div className="mb-6 flex items-center gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 w-20 rounded-full" rounded="rounded-full" />
                ))}
            </div>

            <div className="space-y-4">
                <div className="theme-surface rounded-2xl border border-white/5 p-4">
                    <Skeleton className="h-4 w-40 mb-4" />
                    <div className="space-y-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <ListItemSkeleton key={i} />
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, i) => (
                        <PostCardSkeleton key={i} compact={i > 0} />
                    ))}
                </div>

                <div className="theme-surface rounded-2xl border border-white/5 p-4">
                    <Skeleton className="h-4 w-40 mb-4" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="theme-surface rounded-xl border border-white/5 p-4">
                                <div className="flex items-start gap-3">
                                    <Skeleton className="w-12 h-12 rounded-2xl" rounded="rounded-2xl" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-40" />
                                        <Skeleton className="h-3 w-[85%]" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

