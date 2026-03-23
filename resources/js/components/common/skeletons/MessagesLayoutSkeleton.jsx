import React from 'react';
import SkeletonBlock from './SkeletonBlock';

/** Two-column messages shell: thread list + main pane */
export default function MessagesLayoutSkeleton() {
    return (
        <div className="flex h-[calc(100vh-60px)] min-h-[400px] w-full max-w-6xl mx-auto gap-0 border border-[var(--theme-border)] rounded-2xl overflow-hidden bg-[var(--theme-surface)]">
            <aside className="w-full max-w-[320px] shrink-0 border-r border-[var(--theme-border)] p-3 space-y-2">
                <SkeletonBlock className="h-10 w-full rounded-xl" />
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex gap-3 p-2 rounded-xl">
                        <SkeletonBlock className="h-12 w-12 rounded-full shrink-0" />
                        <div className="flex-1 space-y-2 min-w-0">
                            <SkeletonBlock className="h-4 w-3/4" />
                            <SkeletonBlock className="h-3 w-full" />
                        </div>
                    </div>
                ))}
            </aside>
            <div className="flex-1 hidden md:flex flex-col items-center justify-center p-8 min-w-0">
                <SkeletonBlock className="h-16 w-16 rounded-full mb-4" />
                <SkeletonBlock className="h-5 w-48 mb-2" />
                <SkeletonBlock className="h-4 w-64 max-w-full" />
            </div>
        </div>
    );
}
