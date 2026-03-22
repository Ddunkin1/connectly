import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { REPORT_REASONS, useSubmitReport } from '../../hooks/useReports';

const inputClass =
    'w-full px-4 py-2.5 rounded-xl bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/80 focus:ring-2 focus:ring-[var(--theme-accent)]/35 focus:border-[var(--theme-accent)] outline-none transition-shadow';

const ReportModal = ({ isOpen, onClose, reportableType, reportableId, title }) => {
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (isOpen) {
            setReason('');
            setDescription('');
        }
    }, [isOpen]);

    const submitMutation = useSubmitReport(() => {
        onClose();
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!reason) return;
        submitMutation.mutate({
            reportable_type: reportableType,
            reportable_id: reportableId,
            reason,
            description: description.trim() || undefined,
        });
    };

    const selectedMeta = REPORT_REASONS.find((r) => r.value === reason);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title || 'Report'} size="md">
            <form onSubmit={handleSubmit} className="space-y-5">
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    Help us understand what happened. Reports are reviewed by our safety team. We&apos;ll investigate and
                    follow up <span className="text-[var(--text-primary)] font-medium">as soon as possible</span> when
                    appropriate — you may not receive a personal reply for every report.
                </p>

                <div>
                    <label
                        htmlFor="report-reason"
                        className="block text-sm font-medium text-[var(--text-primary)] mb-2"
                    >
                        Reason <span className="text-red-400">*</span>
                    </label>
                    <select
                        id="report-reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        required
                        className={inputClass}
                        aria-describedby="report-reason-hint"
                    >
                        <option value="">Choose a reason…</option>
                        {REPORT_REASONS.map((r) => (
                            <option key={r.value} value={r.value}>
                                {r.label}
                            </option>
                        ))}
                    </select>
                    <p id="report-reason-hint" className="mt-1.5 text-xs text-[var(--text-secondary)]">
                        {selectedMeta?.description ??
                            'Pick the option that best describes the issue. You can add context below.'}
                    </p>
                </div>

                <div>
                    <label
                        htmlFor="report-details"
                        className="block text-sm font-medium text-[var(--text-primary)] mb-2"
                    >
                        Additional details <span className="text-[var(--text-secondary)] font-normal">(optional)</span>
                    </label>
                    <textarea
                        id="report-details"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Add links, timestamps, or other context that helps us review faster…"
                        rows={4}
                        maxLength={1000}
                        className={`${inputClass} resize-none min-h-[100px]`}
                    />
                    <p className="mt-1 text-xs text-[var(--text-secondary)] text-right tabular-nums">
                        {description.length} / 1000
                    </p>
                </div>

                <p className="text-xs text-[var(--text-secondary)] border-t border-[var(--theme-border)] pt-4">
                    Misuse of reporting (e.g. false or retaliatory reports) may violate our community guidelines.
                </p>

                <div className="flex flex-wrap justify-end gap-2 pt-1">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--theme-surface-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/30"
                    >
                        Cancel
                    </button>
                    <Button type="submit" disabled={!reason || submitMutation.isPending}>
                        {submitMutation.isPending ? 'Submitting…' : 'Submit report'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default ReportModal;
