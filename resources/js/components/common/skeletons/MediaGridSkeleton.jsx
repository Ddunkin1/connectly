import React from 'react';
import SkeletonBlock from './SkeletonBlock';

/** Square grid for profile media / photo grids */
export default function MediaGridSkeleton({ count = 6, aspectClass = 'aspect-square' }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonBlock key={i} className={`${aspectClass} rounded-xl w-full`} />
            ))}
        </div>
    );
}
