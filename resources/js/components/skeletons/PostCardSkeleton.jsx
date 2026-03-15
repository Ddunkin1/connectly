import React from 'react';
import Skeleton from '../common/Skeleton';

export default function PostCardSkeleton({ compact = false }) {
    return (
        <div className="theme-surface rounded-2xl border border-white/5 shadow-lg p-4 md:p-5">
            <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" rounded="rounded-full" />
                <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-3 w-12" />
                    </div>
                    <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-8 w-8 rounded-xl" rounded="rounded-xl" />
            </div>

            <div className="mt-4 space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-[92%]" />
                {!compact && <Skeleton className="h-3 w-[70%]" />}
            </div>

            {!compact && (
                <div className="mt-4">
                    <Skeleton className="h-44 w-full rounded-2xl" rounded="rounded-2xl" />
                </div>
            )}

            <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-20 rounded-full" rounded="rounded-full" />
                    <Skeleton className="h-9 w-20 rounded-full" rounded="rounded-full" />
                </div>
                <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-20 rounded-full" rounded="rounded-full" />
                    <Skeleton className="h-9 w-10 rounded-full" rounded="rounded-full" />
                </div>
            </div>
        </div>
    );
}

