import React from 'react';

/** Pulse block — matches admin skeleton styling */
export default function SkeletonBlock({ className = '' }) {
    return (
        <div
            className={`rounded-lg bg-[var(--theme-surface-hover)] animate-pulse ${className}`}
            aria-hidden
        />
    );
}
