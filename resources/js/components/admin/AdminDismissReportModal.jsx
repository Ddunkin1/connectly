import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { REPORT_REASONS, getDismissReportMessageTemplate } from '../../hooks/useReports';

const selectClass =
    'w-full appearance-none rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--text-primary)] text-sm py-2.5 pl-3 pr-10 [&::-ms-expand]:hidden';

/**
 * Cancel / dismiss a report with the same reason taxonomy as user reports + editable message to the reporter.
 */
export default function AdminDismissReportModal({
    isOpen,
    onClose,
    onConfirm,
    isPending,
    /** Report's original `reason` — preselect matching category when possible */
    initialReason,
}) {
    const [reason, setReason] = useState('other');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        const r =
            initialReason && REPORT_REASONS.some((x) => x.value === initialReason)
                ? initialReason
                : 'other';
        setReason(r);
        setMessage(getDismissReportMessageTemplate(r));
    }, [isOpen, initialReason]);

    const handleReasonChange = (e) => {
        const v = e.target.value;
        setReason(v);
        setMessage(getDismissReportMessageTemplate(v));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!message.trim() || message.trim().length < 10) return;
        onConfirm({ reason, message: message.trim() });
    };

    if (!isOpen) return null;

    const portal = (
        <>
            <div
                className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-[1px]"
                role="presentation"
                onClick={onClose}
            />
            <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none">
                <div
                    className="pointer-events-auto w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--theme-border)] shrink-0">
                        <div>
                            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Cancel report</h2>
                            <p className="text-xs text-[var(--text-secondary)] mt-1">
                                Same categories as when members report content. The message below is sent to the
                                reporter.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--theme-surface-hover)]"
                            aria-label="Close"
                        >
                            <span className="material-symbols-outlined text-2xl">close</span>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                                    Reason category (matches member report options)
                                </label>
                                <select
                                    value={reason}
                                    onChange={handleReasonChange}
                                    className={selectClass}
                                    disabled={isPending}
                                >
                                    {REPORT_REASONS.map((r) => (
                                        <option key={r.value} value={r.value}>
                                            {r.label}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[11px] text-[var(--text-secondary)] mt-1.5">
                                    {REPORT_REASONS.find((x) => x.value === reason)?.description}
                                </p>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                                    Message to reporter (prefilled — edit as needed)
                                </label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={8}
                                    required
                                    minLength={10}
                                    maxLength={2000}
                                    disabled={isPending}
                                    className="w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] text-sm p-3 text-[var(--text-primary)]"
                                    placeholder="Explain why this report is being closed without action…"
                                />
                                <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                                    {message.trim().length}/2000 · minimum 10 characters
                                </p>
                            </div>
                        </div>
                        <div className="px-5 py-3 border-t border-[var(--theme-border)] flex flex-wrap gap-2 justify-end shrink-0 bg-[var(--theme-surface)]">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isPending}
                                className="px-4 py-2 rounded-xl text-sm font-medium border border-[var(--theme-border)] text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] disabled:opacity-50"
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={isPending || message.trim().length < 10}
                                className="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--text-secondary)] text-white hover:opacity-90 disabled:opacity-50"
                            >
                                {isPending ? 'Sending…' : 'Cancel report & notify reporter'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );

    return createPortal(portal, document.body);
}
