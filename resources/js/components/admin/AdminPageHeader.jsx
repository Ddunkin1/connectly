import React from 'react';

/**
 * Consistent page title block for admin pages.
 */
const AdminPageHeader = ({ eyebrow, title, description, children }) => (
    <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
            {eyebrow && (
                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    {eyebrow}
                </p>
            )}
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mt-1">{title}</h1>
            {description && (
                <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-2xl">{description}</p>
            )}
        </div>
        {children && <div className="shrink-0 flex flex-wrap gap-2">{children}</div>}
    </div>
);

export default AdminPageHeader;
