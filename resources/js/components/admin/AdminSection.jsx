import React from 'react';

/**
 * Card section with optional title and actions (filters, buttons).
 */
const AdminSection = ({ title, description, actions, children, className = '', padding = true }) => (
    <section
        className={`rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] shadow-sm ${className}`}
    >
        {(title || actions) && (
            <div
                className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--theme-border)] ${
                    padding ? 'px-5 py-4' : ''
                }`}
            >
                <div>
                    {title && <h2 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h2>}
                    {description && (
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">{description}</p>
                    )}
                </div>
                {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
            </div>
        )}
        <div className={padding ? 'p-5' : ''}>{children}</div>
    </section>
);

export default AdminSection;
