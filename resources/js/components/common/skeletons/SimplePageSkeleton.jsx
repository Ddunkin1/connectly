import React from 'react';
import SkeletonBlock from './SkeletonBlock';

/**
 * Generic list / settings-style page placeholder (Notifications, Bookmarks, Connections, Onboarding, etc.)
 */
export default function SimplePageSkeleton({ rows = 8, title = true }) {
    return (
        <div className="w-full max-w-3xl mx-auto space-y-4 py-4 px-4">
            {title && (
                <div className="space-y-2 mb-6">
                    <SkeletonBlock className="h-8 w-48" />
                    <SkeletonBlock className="h-4 w-72 max-w-full" />
                </div>
            )}
            <div className="space-y-3">
                {Array.from({ length: rows }).map((_, i) => (
                    <div
                        key={i}
                        className="flex gap-3 items-center p-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)]"
                    >
                        <SkeletonBlock className="h-12 w-12 rounded-full shrink-0" />
                        <div className="flex-1 space-y-2 min-w-0">
                            <SkeletonBlock className="h-4 w-3/4 max-w-xs" />
                            <SkeletonBlock className="h-3 w-full max-w-md" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/** Compact analytics / stat cards */
export function AnalyticsSkeleton() {
    return (
        <div className="w-full max-w-4xl mx-auto space-y-6 py-4 px-4">
            <div className="space-y-2">
                <SkeletonBlock className="h-9 w-56" />
                <SkeletonBlock className="h-4 w-80 max-w-full" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <SkeletonBlock key={i} className="h-28 rounded-2xl" />
                ))}
            </div>
            <SkeletonBlock className="h-64 w-full rounded-2xl" />
        </div>
    );
}
