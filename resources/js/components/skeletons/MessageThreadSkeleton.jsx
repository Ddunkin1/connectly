import React from 'react';
import Skeleton from '../common/Skeleton';

export default function MessageThreadSkeleton() {
    return (
        <div className="flex-1 min-h-0 overflow-hidden px-5 py-5 flex flex-col gap-5" aria-busy="true">
            <div className="flex justify-start">
                <Skeleton className="h-12 w-48 rounded-2xl" rounded="rounded-2xl" />
            </div>
            <div className="flex justify-end">
                <Skeleton className="h-12 w-56 rounded-2xl" rounded="rounded-2xl" />
            </div>
            <div className="flex justify-start">
                <Skeleton className="h-12 w-40 rounded-2xl" rounded="rounded-2xl" />
            </div>
            <div className="flex justify-end">
                <Skeleton className="h-14 w-64 rounded-2xl" rounded="rounded-2xl" />
            </div>
        </div>
    );
}
