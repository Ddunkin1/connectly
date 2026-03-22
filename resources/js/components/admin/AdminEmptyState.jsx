import React from 'react';

const AdminEmptyState = ({
    icon = 'inbox',
    title = 'Nothing here',
    description,
    action,
}) => (
    <div
        className="flex flex-col items-center justify-center py-16 px-6 text-center rounded-xl border border-dashed border-[var(--theme-border)] bg-[var(--theme-surface-hover)]/40"
        role="status"
    >
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--theme-accent)]/10 text-[var(--theme-accent)]">
            <span className="material-symbols-outlined text-3xl" aria-hidden>
                {icon}
            </span>
        </div>
        <p className="text-[var(--text-primary)] font-semibold tracking-tight">{title}</p>
        {description && (
            <p className="text-sm text-[var(--text-secondary)] mt-2 max-w-md leading-relaxed">{description}</p>
        )}
        {action && <div className="mt-5">{action}</div>}
    </div>
);

export default AdminEmptyState;
