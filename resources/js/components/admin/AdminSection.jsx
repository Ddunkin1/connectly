import React from 'react';

/**
 * Elevated card section with optional title strip.
 */
const AdminSection = ({ title, description, actions, children, className = '', padding = true }) => (
    <section
        className={`relative overflow-hidden rounded-3xl border border-[var(--theme-border)] bg-[var(--theme-surface)]/95 shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_14px_36px_-18px_rgba(0,0,0,0.55)] transition-all duration-300 hover:border-[var(--theme-accent)]/25 ${className}`}
    >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        {(title || actions) && (
            <div
                className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--theme-border)] bg-gradient-to-r from-[var(--theme-surface-hover)]/40 to-[var(--theme-accent)]/5 ${
                    padding ? 'px-6 py-4' : ''
                }`}
            >
                <div>
                    {title && (
                        <h2 className="text-base font-semibold tracking-tight text-[var(--text-primary)]">
                            {title}
                        </h2>
                    )}
                    {description && (
                        <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">{description}</p>
                    )}
                </div>
                {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
            </div>
        )}
        <div className={padding ? 'p-6' : ''}>{children}</div>
    </section>
);

export default AdminSection;
