import { useMutation, useQuery } from '@tanstack/react-query';
import { reportsAPI } from '../services/api';
import toast from 'react-hot-toast';

/**
 * Canonical list — must match `App\Models\Report::REASONS` (snake_case values).
 * Labels are user-facing for a general social product (posts, profiles, comments).
 *
 * `URGENT_REPORT_REASONS` must match `App\Models\Report::URGENT_REASONS` (order not important).
 */
export const URGENT_REPORT_REASONS = ['violence', 'hate_speech', 'harassment'];

export const REPORT_REASONS = [
    { value: 'spam', label: 'Spam or scams', description: 'Unwanted commercial content, fake engagement, or phishing' },
    { value: 'harassment', label: 'Harassment or bullying', description: 'Targeted abuse, intimidation, or repeated unwanted contact' },
    { value: 'hate_speech', label: 'Hate speech', description: 'Attacks based on identity (race, religion, gender, etc.)' },
    { value: 'violence', label: 'Violence or threats', description: 'Threats of harm, glorification of violence, or dangerous organizations' },
    { value: 'sexual_content', label: 'Nudity or sexual content', description: 'Non-consensual intimate imagery or sexual content that violates rules' },
    { value: 'misinformation', label: 'False or misleading information', description: 'Harmful claims presented as fact (health, elections, emergencies)' },
    { value: 'impersonation', label: 'Impersonation', description: 'Pretending to be another person, brand, or organization' },
    { value: 'intellectual_property', label: 'Copyright or trademark', description: 'Content used without permission' },
    { value: 'self_harm', label: 'Self-harm or suicide', description: 'Content that promotes or encourages self-injury' },
    { value: 'inappropriate', label: 'Sensitive or disturbing content', description: 'Graphic, shocking, or otherwise inappropriate material' },
    { value: 'other', label: 'Something else', description: 'Use “Additional details” to explain' },
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
        onSuccess: (axiosResponse) => {
            const msg =
                axiosResponse?.data?.message ||
                'Thanks — we received your report. Our team will investigate and follow up as soon as possible.';
            toast.success(msg, { duration: 6000 });
            onSuccess?.();
        },
        onError: (error) => {
            const msg = error.response?.data?.message || 'Failed to submit report';
            toast.error(msg);
        },
    });
};
