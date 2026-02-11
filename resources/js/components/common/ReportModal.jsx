import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { REPORT_REASONS, useSubmitReport } from '../../hooks/useReports';

const ReportModal = ({ isOpen, onClose, reportableType, reportableId, title }) => {
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const submitMutation = useSubmitReport(() => {
        setReason('');
        setDescription('');
        onClose();
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!reason) return;
        submitMutation.mutate(
            { reportable_type: reportableType, reportable_id: reportableId, reason, description: description || undefined },
            { onSuccess: () => onClose() }
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title || 'Report'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Reason</label>
                    <select
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        required
                        className="w-full px-4 py-2 rounded-lg bg-[#1A1A1A] border border-gray-600 text-white"
                    >
                        <option value="">Select a reason</option>
                        {REPORT_REASONS.map((r) => (
                            <option key={r.value} value={r.value}>
                                {r.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Additional details (optional)</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Provide more context..."
                        rows={3}
                        maxLength={1000}
                        className="w-full px-4 py-2 rounded-lg bg-[#1A1A1A] border border-gray-600 text-white placeholder-gray-500 resize-none"
                    />
                </div>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={!reason || submitMutation.isPending}>
                        {submitMutation.isPending ? 'Submitting...' : 'Submit report'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default ReportModal;
