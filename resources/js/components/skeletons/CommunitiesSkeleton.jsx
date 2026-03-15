import React from 'react';
import Skeleton from '../common/Skeleton';

function CommunityCardSkeleton() {
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-start space-x-3">
                <Skeleton className="w-12 h-12 rounded-2xl" rounded="rounded-2xl" />
                <div className="flex-1 min-w-0 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-[90%]" />
                    <Skeleton className="h-3 w-24" />
                </div>
            </div>
        </div>
    );
}

export default function CommunitiesSkeleton() {
    return (
        <div className="max-w-6xl mx-auto" aria-busy="true">
            <div className="mb-6 flex items-center justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-44" />
                    <Skeleton className="h-4 w-56" />
                </div>
                <Skeleton className="h-9 w-40 rounded-lg" rounded="rounded-lg" />
            </div>

            <div className="mb-8">
                <Skeleton className="h-6 w-40 mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <CommunityCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        </div>
    );
}

