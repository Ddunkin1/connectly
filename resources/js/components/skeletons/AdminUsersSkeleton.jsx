import React from 'react';
import ListItemSkeleton from './ListItemSkeleton';
import Skeleton from '../common/Skeleton';

export default function AdminUsersSkeleton() {
    return (
        <div className="theme-surface rounded-lg overflow-hidden" aria-busy="true">
            <div className="grid grid-cols-5 gap-4 px-4 py-3 bg-[#1A1A2E]">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-16" />
            </div>
            <div className="divide-y divide-gray-700">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="px-4 py-3">
                        <ListItemSkeleton lines={2} right={false} />
                    </div>
                ))}
            </div>
        </div>
    );
}
