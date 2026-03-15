import React from 'react';
import Skeleton from '../common/Skeleton';

export default function SharedMediaSkeleton() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4" aria-busy="true">
            {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square w-full rounded-lg" rounded="rounded-lg" />
            ))}
        </div>
    );
}
