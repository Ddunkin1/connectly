import React from 'react';

/**
 * Responsive wrapper + consistent thead styling for admin tables.
 */
const AdminDataTable = ({ children, className = '' }) => (
    <div className={`rounded-2xl border border-[var(--theme-border)] overflow-hidden bg-[var(--theme-surface)] ${className}`}>
        <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">{children}</table>
        </div>
    </div>
);

export const AdminTableHead = ({ children }) => (
    <thead className="bg-[var(--theme-surface-hover)]">
        <tr>{children}</tr>
    </thead>
);

export const AdminTh = ({ children, scope = 'col', className = '' }) => (
    <th
        scope={scope}
        className={`text-left px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase ${className}`}
    >
        {children}
    </th>
);

export default AdminDataTable;
