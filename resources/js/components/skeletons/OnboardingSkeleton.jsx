import React from 'react';
import Skeleton from '../common/Skeleton';
import ListItemSkeleton from './ListItemSkeleton';

export default function OnboardingSkeleton() {
    return (
        <div className="max-w-4xl mx-auto py-8" aria-busy="true">
            <div className="flex items-center justify-between mb-6">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-80 max-w-[85vw]" />
                    <Skeleton className="h-4 w-72 max-w-[70vw]" />
                </div>
                <Skeleton className="h-4 w-20" />
            </div>
            <div className="glass-effect rounded-2xl p-4 md:p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="space-y-2">
                        <Skeleton className="h-3 w-40" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-6 w-12" />
                </div>
                <Skeleton className="w-full h-2 rounded-full" rounded="rounded-full" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="theme-surface rounded-2xl p-4 border border-white/5">
                    <Skeleton className="h-5 w-44 mb-4" />
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <ListItemSkeleton key={i} lines={2} />
                        ))}
                    </div>
                </div>
                <div className="theme-surface rounded-2xl p-4 border border-white/5">
                    <Skeleton className="h-5 w-48 mb-4" />
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <Skeleton className="w-12 h-12 rounded-xl" rounded="rounded-xl" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                                <Skeleton className="h-9 w-20 rounded-full" rounded="rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
