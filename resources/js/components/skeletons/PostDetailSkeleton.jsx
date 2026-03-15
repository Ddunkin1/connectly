import React from 'react';
import Skeleton from '../common/Skeleton';
import PostCardSkeleton from './PostCardSkeleton';

function CommentRowSkeleton() {
    return (
        <div className="flex gap-3 py-3">
            <Skeleton className="w-8 h-8 rounded-full shrink-0" rounded="rounded-full" />
            <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-[70%]" />
            </div>
        </div>
    );
}

export default function PostDetailSkeleton() {
    return (
        <div className="max-w-3xl mx-auto" aria-busy="true">
            <PostCardSkeleton compact={false} />
            <div className="mt-4 theme-surface rounded-2xl border border-white/5 p-4">
                <div className="flex items-start gap-3 mb-4">
                    <Skeleton className="w-10 h-10 rounded-full shrink-0" rounded="rounded-full" />
                    <Skeleton className="h-10 flex-1 rounded-full" rounded="rounded-full" />
                </div>
                <div className="divide-y divide-white/5">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <CommentRowSkeleton key={i} />
                    ))}
                </div>
            </div>
        </div>
    );
}
