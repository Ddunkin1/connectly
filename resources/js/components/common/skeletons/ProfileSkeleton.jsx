import React from 'react';
import SkeletonBlock from './SkeletonBlock';

export default function ProfileSkeleton() {
    return (
        <div className="w-full space-y-0">
            <SkeletonBlock className="h-36 sm:h-48 w-full rounded-none" />
            <div className="px-4 max-w-4xl mx-auto -mt-12 sm:-mt-16 relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                    <SkeletonBlock className="h-28 w-28 sm:h-32 sm:w-32 rounded-full border-4 border-[var(--bg-secondary)] shrink-0" />
                    <div className="flex-1 space-y-3 pb-4 pt-2 sm:pt-0">
                        <SkeletonBlock className="h-8 w-48 max-w-full" />
                        <SkeletonBlock className="h-4 w-32" />
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-8 mb-6">
                    <SkeletonBlock className="h-16 rounded-xl" />
                    <SkeletonBlock className="h-16 rounded-xl" />
                    <SkeletonBlock className="h-16 rounded-xl" />
                </div>
                <div className="flex gap-4 border-b border-[var(--theme-border)] pb-2 mb-4">
                    <SkeletonBlock className="h-8 w-20" />
                    <SkeletonBlock className="h-8 w-20" />
                    <SkeletonBlock className="h-8 w-20" />
                </div>
                <div className="space-y-4">
                    <SkeletonBlock className="h-24 rounded-xl" />
                    <SkeletonBlock className="h-24 rounded-xl" />
                </div>
            </div>
        </div>
    );
}
