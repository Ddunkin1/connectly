import React from 'react';
import Skeleton from '../common/Skeleton';

function NotificationRowSkeleton() {
    return (
        <div className="flex items-start gap-3 px-4 py-3">
            <Skeleton className="w-10 h-10 rounded-full shrink-0" rounded="rounded-full" />
            <div className="flex-1 min-w-0 space-y-2">
                <Skeleton className="h-3 w-full max-w-[90%]" />
                <Skeleton className="h-3 w-32" />
            </div>
        </div>
    );
}

export default function NotificationsSkeleton() {
    return (
        <div className="divide-y divide-[var(--border-color)]" aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => (
                <NotificationRowSkeleton key={i} />
            ))}
        </div>
    );
}
