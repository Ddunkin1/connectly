import React from 'react';

const shimmer = 'animate-pulse bg-white/[0.06] rounded-xl';

const Block = ({ className = '' }) => (
    <div className={`${shimmer} ${className}`} />
);

/**
 * Full-page loading skeleton shown while a lazy route chunk is loading.
 */
const PageSkeleton = () => (
    <div className="w-full max-w-3xl mx-auto py-8 px-4 space-y-5">
        {/* Page title */}
        <Block className="h-7 w-40" />

        {/* Post-card-like skeletons */}
        {[1, 2, 3].map((i) => (
            <div
                key={i}
                className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-4"
            >
                <div className="flex items-center gap-3">
                    <Block className="h-10 w-10 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                        <Block className="h-3.5 w-32" />
                        <Block className="h-3 w-20" />
                    </div>
                </div>
                <Block className="h-4 w-full" />
                <Block className="h-4 w-5/6" />
                {i === 1 && <Block className="h-48 w-full rounded-xl" />}
                <div className="flex gap-6 pt-1">
                    <Block className="h-4 w-12" />
                    <Block className="h-4 w-12" />
                    <Block className="h-4 w-12" />
                </div>
            </div>
        ))}
    </div>
);

export default PageSkeleton;
