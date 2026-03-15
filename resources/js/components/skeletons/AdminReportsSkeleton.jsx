import React from 'react';
import Skeleton from '../common/Skeleton';

export default function AdminReportsSkeleton() {
    return (
        <div className="space-y-4" aria-busy="true">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="theme-surface rounded-lg p-4 border border-gray-700">
                    <Skeleton className="h-4 w-full max-w-md mb-2" />
                    <Skeleton className="h-3 w-64 mb-2" />
                    <div className="flex gap-2 mt-3">
                        <Skeleton className="h-8 w-20 rounded" rounded="rounded" />
                        <Skeleton className="h-8 w-20 rounded" rounded="rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}
