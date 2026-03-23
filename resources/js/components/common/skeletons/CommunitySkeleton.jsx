import React from 'react';
import SkeletonBlock from './SkeletonBlock';

/** Community list or detail header + content */
export default function CommunitySkeleton({ variant = 'list' }) {
    if (variant === 'detail') {
        return (
            <div className="w-full max-w-4xl mx-auto space-y-6 py-4">
                <SkeletonBlock className="h-40 w-full rounded-2xl" />
                <div className="flex gap-4 items-center">
                    <SkeletonBlock className="h-20 w-20 rounded-xl shrink-0" />
                    <div className="space-y-2 flex-1">
                        <SkeletonBlock className="h-7 w-48" />
                        <SkeletonBlock className="h-4 w-full max-w-md" />
                    </div>
                </div>
                <SkeletonBlock className="h-32 w-full rounded-xl" />
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <SkeletonBlock key={i} className="h-24 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }
    return (
        <div className="w-full max-w-4xl mx-auto space-y-4 py-4">
            <SkeletonBlock className="h-10 w-full max-w-md rounded-xl" />
            <div className="grid gap-4 sm:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                    <SkeletonBlock key={i} className="h-36 rounded-2xl" />
                ))}
            </div>
        </div>
    );
}
