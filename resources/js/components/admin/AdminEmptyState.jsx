import React from 'react';

const AdminEmptyState = ({
    icon = 'inbox',
    title = 'Nothing here',
    description,
    action,
}) => (
    <div
        className="flex flex-col items-center justify-center py-14 px-4 text-center rounded-2xl border border-dashed border-[var(--theme-border)] bg-[var(--theme-surface)]/60"
        role="status"
    >
        <span
            className="material-symbols-outlined text-5xl text-[var(--text-secondary)]/50 mb-3"
            aria-hidden
        >
            {icon}
        </span>
        <p className="text-[var(--text-primary)] font-medium">{title}</p>
        {description && <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-md">{description}</p>}
        {action && <div className="mt-4">{action}</div>}
    </div>
);

export default AdminEmptyState;
