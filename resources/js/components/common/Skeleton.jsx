import React from 'react';

export default function Skeleton({ className = '', rounded = 'rounded-xl', 'aria-hidden': ariaHidden = true }) {
    return (
        <div
            aria-hidden={ariaHidden}
            className={`skeleton-shimmer ${rounded} ${className}`}
        />
    );
}

