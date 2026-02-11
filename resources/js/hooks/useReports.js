import { useMutation, useQuery } from '@tanstack/react-query';
import { reportsAPI } from '../services/api';
import toast from 'react-hot-toast';

export const REPORT_REASONS = [
    { value: 'spam', label: 'Spam' },
    { value: 'harassment', label: 'Harassment or bullying' },
    { value: 'hate_speech', label: 'Hate speech or symbols' },
    { value: 'violence', label: 'Violence or threats' },
    { value: 'inappropriate', label: 'Inappropriate content' },
    { value: 'other', label: 'Other' },
];

export const useReportStatus = (reportableType, reportableId) => {
    return useQuery({
        queryKey: ['report-status', reportableType, reportableId],
        queryFn: () => reportsAPI.getReportStatus(reportableType, reportableId),
        enabled: !!reportableType && !!reportableId,
        select: (data) => data.data,
    });
};

export const useSubmitReport = (onSuccess) => {
    return useMutation({
        mutationFn: (data) => reportsAPI.submitReport(data),
        onSuccess: (response, variables) => {
            toast.success('Report submitted successfully. Our team will review it.');
            onSuccess?.();
        },
        onError: (error) => {
            const msg = error.response?.data?.message || 'Failed to submit report';
            toast.error(msg);
        },
    });
};
