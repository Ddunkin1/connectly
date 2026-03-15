import React from 'react';
import Skeleton from '../common/Skeleton';

export default function StoriesRowSkeleton() {
    return (
        <div className="flex gap-3 overflow-x-auto pt-4 pb-3 scrollbar-hide h-[88px] items-end mt-1">
            {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center space-y-2 flex-shrink-0">
                    <Skeleton className="w-14 h-14 rounded-xl" rounded="rounded-xl" />
                    <Skeleton className="h-2.5 w-12" />
                </div>
            ))}
        </div>
    );
}
