import React from 'react';
import ListItemSkeleton from './ListItemSkeleton';

export default function ConnectionsSkeleton() {
    return (
        <div className="divide-y divide-white/5" aria-busy="true">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="px-4 py-3">
                    <ListItemSkeleton lines={2} right />
                </div>
            ))}
        </div>
    );
}
