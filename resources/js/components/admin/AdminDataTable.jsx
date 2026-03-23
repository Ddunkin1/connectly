import React from 'react';

/**
 * Responsive wrapper + consistent thead styling for admin tables.
 */
const AdminDataTable = ({ children, className = '' }) => (
    <div className={`rounded-3xl border border-[var(--theme-border)] overflow-hidden bg-[var(--theme-surface)]/95 shadow-[0_12px_34px_-18px_rgba(0,0,0,0.55)] ${className}`}>
        <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">{children}</table>
        </div>
    </div>
);

export const AdminTableHead = ({ children }) => (
    <thead className="bg-gradient-to-r from-[var(--theme-surface-hover)] to-[var(--theme-accent)]/10">
        <tr>{children}</tr>
    </thead>
);

export const AdminTh = ({ children, scope = 'col', className = '' }) => (
    <th
        scope={scope}
        className={`text-left px-4 py-3 text-[11px] font-semibold tracking-[0.08em] text-[var(--text-secondary)] uppercase ${className}`}
    >
        {children}
    </th>
);

export default AdminDataTable;
