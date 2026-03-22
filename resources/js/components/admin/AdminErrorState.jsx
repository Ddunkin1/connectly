import React from 'react';

/**
 * Inline error with optional retry; use role="alert" for screen readers.
 */
const AdminErrorState = ({ title = 'Something went wrong', message, onRetry, retryLabel = 'Try again' }) => (
    <div
        className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 text-center"
        role="alert"
        aria-live="polite"
    >
        <span className="material-symbols-outlined text-red-400 text-3xl mb-2 block" aria-hidden>
            error
        </span>
        <p className="text-red-400 font-medium">{title}</p>
        {message && <p className="text-sm text-[var(--text-secondary)] mt-2 max-w-lg mx-auto">{message}</p>}
        {onRetry && (
            <button
                type="button"
                onClick={onRetry}
                className="mt-4 px-4 py-2 rounded-xl text-sm font-medium bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)]"
            >
                {retryLabel}
            </button>
        )}
    </div>
);

export default AdminErrorState;
