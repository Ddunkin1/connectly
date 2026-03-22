import React from 'react';

/**
 * Metric card with optional accent and loading state.
 */
const AdminStatCard = ({
    label,
    value,
    sublabel,
    loading = false,
    accent = false,
    valueClassName = '',
    className = '',
}) => (
    <div
        className={`rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 shadow-sm ${className}`}
        role="status"
        aria-busy={loading}
    >
        <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide">{label}</p>
        {loading ? (
            <div className="h-9 mt-2 rounded-lg bg-[var(--theme-surface-hover)] animate-pulse" aria-hidden />
        ) : (
            <p
                className={`text-2xl font-bold mt-1 tabular-nums ${
                    valueClassName ||
                    (accent ? 'text-[var(--theme-accent)]' : 'text-[var(--text-primary)]')
                }`}
            >
                {value ?? '—'}
            </p>
        )}
        {sublabel && !loading && (
            <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed">{sublabel}</p>
        )}
    </div>
);

export default AdminStatCard;
