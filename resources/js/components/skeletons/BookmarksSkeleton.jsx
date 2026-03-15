import React from 'react';
import Skeleton from '../common/Skeleton';
import PostCardSkeleton from './PostCardSkeleton';

export default function BookmarksSkeleton() {
    return (
        <div className="max-w-2xl mx-auto py-8" aria-busy="true">
            <Skeleton className="h-8 w-44 mb-4" />
            <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <PostCardSkeleton key={i} compact={i > 1} />
                ))}
            </div>
        </div>
    );
}
