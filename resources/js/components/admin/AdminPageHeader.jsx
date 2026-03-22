import React from 'react';

/**
 * Page title block for admin — clear hierarchy + optional actions.
 */
const AdminPageHeader = ({ eyebrow, title, description, children }) => (
    <div className="mb-10 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
        <div className="space-y-2">
            {eyebrow && (
                <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--theme-accent)]">
                    <span className="h-px w-6 bg-[var(--theme-accent)]/60" aria-hidden />
                    {eyebrow}
                </p>
            )}
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-[2rem] leading-tight">
                {title}
            </h1>
            {description && (
                <p className="text-sm leading-relaxed text-[var(--text-secondary)] max-w-2xl">{description}</p>
            )}
        </div>
        {children && (
            <div className="shrink-0 flex flex-wrap items-center gap-2">{children}</div>
        )}
    </div>
);

export default AdminPageHeader;
