import React from 'react';
import SkeletonBlock from './SkeletonBlock';

export default function PostDetailSkeleton() {
    return (
        <div className="w-full max-w-2xl mx-auto space-y-4 py-4">
            <div className="flex gap-3 items-center">
                <SkeletonBlock className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                    <SkeletonBlock className="h-4 w-40" />
                    <SkeletonBlock className="h-3 w-28" />
                </div>
            </div>
            <SkeletonBlock className="h-64 w-full rounded-2xl" />
            <SkeletonBlock className="h-5 w-full" />
            <SkeletonBlock className="h-5 w-[85%]" />
            <SkeletonBlock className="h-5 w-[60%]" />
        </div>
    );
}
