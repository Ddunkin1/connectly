import React from 'react';

/**
 * Elevated card section with optional title strip.
 */
const AdminSection = ({ title, description, actions, children, className = '', padding = true }) => (
    <section
        className={`relative overflow-hidden rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_8px_40px_-12px_rgba(0,0,0,0.4)] ${className}`}
    >
        {(title || actions) && (
            <div
                className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--theme-border)] bg-[var(--theme-surface-hover)]/30 ${
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
