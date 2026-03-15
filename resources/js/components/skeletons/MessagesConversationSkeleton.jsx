import React from 'react';
import Skeleton from '../common/Skeleton';

export default function MessagesConversationSkeleton() {
    return (
        <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden" aria-busy="true">
            <div className="shrink-0 px-4 py-3 border-b border-[var(--theme-border)] flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" rounded="rounded-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                </div>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden p-4 space-y-4">
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
                    <Skeleton className="h-12 w-64 rounded-2xl" rounded="rounded-2xl" />
                </div>
            </div>
            <div className="shrink-0 p-4 border-t border-[var(--theme-border)]">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 flex-1 rounded-full" rounded="rounded-full" />
                    <Skeleton className="h-10 w-10 rounded-full" rounded="rounded-full" />
                </div>
            </div>
        </div>
    );
}
