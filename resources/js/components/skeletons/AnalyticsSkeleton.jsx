import React from 'react';
import Skeleton from '../common/Skeleton';

export default function AnalyticsSkeleton() {
    return (
        <div className="max-w-4xl mx-auto py-8" aria-busy="true">
            <Skeleton className="h-8 w-28 mb-2" />
            <Skeleton className="h-4 w-80 mb-6" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="theme-surface rounded-xl p-6">
                        <Skeleton className="h-9 w-16 mb-2" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                ))}
            </div>
            <section className="theme-surface rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <Skeleton className="h-6 w-56" />
                    <Skeleton className="h-4 w-24" />
                </div>
                <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex gap-4 py-2 border-b border-[var(--theme-border)] last:border-0">
                            <Skeleton className="h-4 flex-1" />
                            <Skeleton className="h-4 w-12" />
                            <Skeleton className="h-4 w-14" />
                            <Skeleton className="h-4 w-20" />
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
