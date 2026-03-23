import React from 'react';
import SkeletonBlock from './SkeletonBlock';

/**
 * Feed-style loading (Home, Explore, Search, etc.) — composer + stacked post cards.
 */
export default function FeedSkeleton({ cards = 4, showComposer = true }) {
    return (
        <div className="w-full space-y-6">
            <div className="flex gap-8 xl:gap-10 items-start">
                <div className="flex-1 min-w-0 space-y-6">
                    {showComposer && (
                        <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 space-y-3">
                            <div className="flex gap-3">
                                <SkeletonBlock className="h-10 w-10 rounded-full shrink-0" />
                                <SkeletonBlock className="h-24 flex-1 rounded-xl" />
                            </div>
                        </div>
                    )}
                    <div className="space-y-5">
                        {Array.from({ length: cards }).map((_, i) => (
                            <div
                                key={i}
                                className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 space-y-3"
                            >
                                <div className="flex gap-3">
                                    <SkeletonBlock className="h-11 w-11 rounded-full shrink-0" />
                                    <div className="flex-1 space-y-2 min-w-0">
                                        <SkeletonBlock className="h-4 w-32" />
                                        <SkeletonBlock className="h-3 w-24" />
                                    </div>
                                </div>
                                <SkeletonBlock className="h-4 w-full max-w-[90%]" />
                                <SkeletonBlock className="h-4 w-full max-w-[70%]" />
                                <SkeletonBlock className="h-40 w-full rounded-xl" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
