import React from 'react';
import Skeleton from '../common/Skeleton';
import PostCardSkeleton from './PostCardSkeleton';

export default function CommunityDetailSkeleton() {
    return (
        <div className="max-w-5xl mx-auto" aria-busy="true">
            <div className="theme-surface rounded-2xl overflow-hidden mb-6 border border-[var(--theme-border)]">
                <div className="h-48 relative">
                    <Skeleton className="absolute inset-0 w-full h-full" rounded="rounded-none" />
                </div>
                <div className="p-6 relative">
                    <div className="absolute -top-12 left-6">
                        <Skeleton className="w-24 h-24 rounded-2xl" rounded="rounded-2xl" />
                    </div>
                    <div className="pt-12 space-y-2">
                        <Skeleton className="h-7 w-56" />
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-full max-w-md" />
                    </div>
                    <div className="mt-4 flex gap-2">
                        <Skeleton className="h-9 w-28 rounded-full" rounded="rounded-full" />
                        <Skeleton className="h-9 w-24 rounded-full" rounded="rounded-full" />
                    </div>
                </div>
            </div>
            <div className="flex gap-2 mb-4">
                <Skeleton className="h-9 w-20 rounded-full" rounded="rounded-full" />
                <Skeleton className="h-9 w-24 rounded-full" rounded="rounded-full" />
            </div>
            <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <PostCardSkeleton key={i} compact={i > 0} />
                ))}
            </div>
        </div>
    );
}
