import React from 'react';

/**
 * Metric card with optional accent, icon, and subtle depth.
 */
const AdminStatCard = ({
    label,
    value,
    sublabel,
    loading = false,
    accent = false,
    icon,
    valueClassName = '',
    className = '',
}) => (
    <div
        className={`group admin-shimmer relative overflow-hidden rounded-3xl border border-[var(--theme-border)] bg-[var(--theme-surface)]/95 p-5 shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_12px_34px_-16px_rgba(0,0,0,0.5)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-16px_rgba(0,0,0,0.55)] hover:border-[var(--theme-accent)]/35 ${className}`}
        role="status"
        aria-busy={loading}
    >
        {/* Ambient glow */}
        <div
            className={`pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full blur-3xl transition-opacity duration-500 group-hover:opacity-100 ${
                accent
                    ? 'bg-[var(--theme-accent)]/25 opacity-80'
                    : 'bg-[var(--theme-accent)]/10 opacity-60'
            }`}
            aria-hidden
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

        <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--text-secondary)]">
                    {label}
                </p>
                {loading ? (
                    <div className="h-9 mt-3 rounded-lg bg-[var(--theme-surface-hover)] animate-pulse" aria-hidden />
                ) : (
                    <p
                    className={`mt-2 text-3xl font-extrabold tracking-tight tabular-nums ${
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
            {icon && !loading && (
                <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl transition-transform duration-300 group-hover:scale-105 ${
                        accent
                            ? 'bg-[var(--theme-accent)]/20 text-[var(--theme-accent)]'
                            : 'bg-[var(--theme-surface-hover)] text-[var(--text-secondary)]'
                    }`}
                    aria-hidden
                >
                    <span className="material-symbols-outlined">{icon}</span>
                </span>
            )}
        </div>
    </div>
);

export default AdminStatCard;
