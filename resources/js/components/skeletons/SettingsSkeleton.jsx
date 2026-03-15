import React from 'react';
import Skeleton from '../common/Skeleton';

export default function SettingsSkeleton() {
    return (
        <div className="max-w-2xl mx-auto py-8" aria-busy="true">
            <Skeleton className="h-8 w-32 mb-6" />
            <section className="theme-surface rounded-xl p-6 mb-6">
                <Skeleton className="h-6 w-52 mb-4" />
                <Skeleton className="h-4 w-full max-w-md mb-6" />
                <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between py-2">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-6 w-11 rounded-full" rounded="rounded-full" />
                        </div>
                    ))}
                </div>
            </section>
            <section className="theme-surface rounded-xl p-6 mb-6">
                <Skeleton className="h-6 w-44 mb-3" />
                <Skeleton className="h-4 w-full max-w-sm mb-4" />
                <div className="flex gap-3 mb-4">
                    <Skeleton className="h-10 flex-1 rounded-lg" rounded="rounded-lg" />
                    <Skeleton className="h-10 w-16 rounded-lg" rounded="rounded-lg" />
                </div>
            </section>
        </div>
    );
}
