import React from 'react';

/** Pulse block for loading placeholders */
export const AdminSkeletonBlock = ({ className = '' }) => (
    <div className={`rounded-lg bg-[var(--theme-surface-hover)] animate-pulse ${className}`} aria-hidden />
);

/** Table skeleton: header + rows */
export const AdminTableSkeleton = ({ rows = 5, cols = 6 }) => (
    <div className="rounded-2xl border border-[var(--theme-border)] overflow-hidden bg-[var(--theme-surface)]">
        <div className="flex gap-2 p-3 border-b border-[var(--theme-border)] bg-[var(--theme-surface-hover)]">
            {Array.from({ length: cols }).map((_, i) => (
                <AdminSkeletonBlock key={i} className="h-4 flex-1" />
            ))}
        </div>
        <div className="divide-y divide-[var(--theme-border)]">
            {Array.from({ length: rows }).map((_, r) => (
                <div key={r} className="flex gap-2 p-4">
                    {Array.from({ length: cols }).map((_, c) => (
                        <AdminSkeletonBlock key={c} className="h-4 flex-1" />
                    ))}
                </div>
            ))}
        </div>
    </div>
);

/** Stat grid skeleton */
export const AdminStatsRowSkeleton = ({ count = 3 }) => (
    <div
        className={`grid grid-cols-1 gap-4 mb-8 ${
            count >= 4 ? 'sm:grid-cols-2 xl:grid-cols-4' : 'sm:grid-cols-3'
        }`}
    >
        {Array.from({ length: count }).map((_, i) => (
            <div
                key={i}
                className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4"
            >
                <AdminSkeletonBlock className="h-3 w-24 mb-3" />
                <AdminSkeletonBlock className="h-8 w-16" />
            </div>
        ))}
    </div>
);

const AdminSkeleton = { Block: AdminSkeletonBlock, Table: AdminTableSkeleton, StatsRow: AdminStatsRowSkeleton };
export default AdminSkeleton;
