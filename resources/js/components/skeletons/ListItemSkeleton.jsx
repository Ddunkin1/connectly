import React from 'react';
import Skeleton from '../common/Skeleton';

export default function ListItemSkeleton({ lines = 2, right = true, className = '' }) {
    return (
        <div className={`flex items-center justify-between gap-3 ${className}`}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <Skeleton className="w-10 h-10 rounded-full" rounded="rounded-full" />
                <div className="flex-1 min-w-0 space-y-2">
                    <Skeleton className="h-3 w-40 max-w-[70%]" />
                    {lines >= 2 && <Skeleton className="h-3 w-28 max-w-[55%]" />}
                    {lines >= 3 && <Skeleton className="h-3 w-56 max-w-[80%]" />}
                </div>
            </div>
            {right && <Skeleton className="h-9 w-20 rounded-full" rounded="rounded-full" />}
        </div>
    );
}

