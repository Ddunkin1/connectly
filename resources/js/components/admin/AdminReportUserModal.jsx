import React from 'react';
import { createPortal } from 'react-dom';
import AdminReportUserPanel from './AdminReportUserPanel';

/**
 * Standalone user details modal (Admin / Users View, or non–post reports “Moderate”).
 * Wide layout so profile + tabs + actions aren’t cramped.
 */
export default function AdminReportUserModal({ userId, open, onClose, adminUserId }) {
    if (!open || !userId) return null;

    const portal = (
        <>
            <div
                className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4"
                role="presentation"
                onClick={onClose}
            />
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
                <div
                    className="pointer-events-auto flex h-[min(92vh,880px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] shadow-2xl text-[var(--text-primary)]"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--theme-border)] shrink-0">
                        <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
                            User details
                        </h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--theme-surface-hover)] hover:text-[var(--text-primary)] transition-colors"
                            aria-label="Close"
                        >
                            <span className="material-symbols-outlined text-2xl">close</span>
                        </button>
                    </div>
                    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                        <AdminReportUserPanel
                            userId={userId}
                            enabled={open}
                            adminUserId={adminUserId}
                            onClose={onClose}
                            variant="modal"
                        />
                    </div>
                </div>
            </div>
        </>
    );

    return createPortal(portal, document.body);
}
