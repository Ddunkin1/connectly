import React from 'react';
import ListItemSkeleton from './ListItemSkeleton';

export default function SidebarConversationsSkeleton({ count = 5 }) {
    return (
        <div className="space-y-1" aria-hidden="true">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="px-2 py-2">
                    <ListItemSkeleton lines={1} right={false} />
                </div>
            ))}
        </div>
    );
}
