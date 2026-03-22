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

/**
 * Prefilled message when an admin cancels a report — same reason codes as member reports.
 * Admins should edit this before sending.
 */
export function getDismissReportMessageTemplate(reasonValue) {
    const meta = REPORT_REASONS.find((r) => r.value === reasonValue);
    if (!meta) {
        return 'We reviewed your report and are closing it without further action. You can add more detail below.\n\n';
    }
    return `We reviewed your report under “${meta.label}”. After review, we did not find a violation of our community standards for this case. You may reply with more context if needed.\n\n`;
}

/** Label for a reason code — same list as member reports */
export function getReasonLabel(reasonValue) {
    return REPORT_REASONS.find((r) => r.value === reasonValue)?.label ?? reasonValue?.replace(/_/g, ' ') ?? '—';
}

const WARN_BODY = {
    spam:
        'Your account has received a formal warning for spam or scams — for example unsolicited commercial messages, fake engagement, phishing, or misleading links.\n\nWhat to do next: Remove or stop the behavior described above. Further violations may lead to suspension or a permanent ban.',
    harassment:
        'Your account has received a formal warning for harassment or bullying — including targeted abuse, intimidation, stalking, or repeated unwanted contact.\n\nWhat to do next: Treat others respectfully and stop contacting anyone who has asked you to stop. Further violations may lead to suspension or a permanent ban.',
    hate_speech:
        'Your account has received a formal warning for hate speech — attacks or slurs based on identity such as race, religion, gender, sexual orientation, or disability.\n\nWhat to do next: Do not post content that demeans people based on protected characteristics. Further violations may lead to suspension or a permanent ban.',
    violence:
        'Your account has received a formal warning for violence or threats — including threats of harm, glorification of violence, or content from dangerous organizations.\n\nWhat to do next: Remove threatening or violent content and follow our safety rules. Further violations may lead to suspension or a permanent ban.',
    sexual_content:
        'Your account has received a formal warning for nudity or sexual content that breaks our rules — including non-consensual intimate imagery or sexual content shared without consent.\n\nWhat to do next: Remove the content in question and do not post sexual material that violates our policies. Further violations may lead to suspension or a permanent ban.',
    misinformation:
        'Your account has received a formal warning for false or misleading information presented as fact in sensitive areas (for example health, safety, or civic processes).\n\nWhat to do next: Correct or remove misleading claims and rely on reputable sources. Further violations may lead to suspension or a permanent ban.',
    impersonation:
        'Your account has received a formal warning for impersonation — pretending to be another person, brand, or organization in a misleading way.\n\nWhat to do next: Clearly identify yourself and stop impersonating others. Further violations may lead to suspension or a permanent ban.',
    intellectual_property:
        'Your account has received a formal warning for copyright or trademark issues — using someone else’s creative work, branding, or trademarks without permission.\n\nWhat to do next: Remove infringing content and only share material you have rights to use. Further violations may lead to suspension or a permanent ban.',
    self_harm:
        'Your account has received a formal warning for content related to self-harm or suicide — including content that promotes or encourages self-injury.\n\nWhat to do next: Remove harmful content. If you or someone you know is in crisis, please contact local emergency services or a crisis hotline. Further violations may lead to suspension or a permanent ban.',
    inappropriate:
        'Your account has received a formal warning for sensitive or disturbing content — graphic, shocking, or otherwise inappropriate material that violates our community standards.\n\nWhat to do next: Remove the content and avoid posting material that may harm or disturb others. Further violations may lead to suspension or a permanent ban.',
    other:
        'Your account has received a formal warning for activity that violates our community standards (category: other).\n\nWhat to do next: Review our rules and remove or change the behavior described by our team below. Further violations may lead to suspension or a permanent ban.',
};

/**
 * Prefilled warning email / notification body — matches “Reason for action” in admin.
 */
export function getModerationWarningMessageTemplate(reasonValue) {
    return WARN_BODY[reasonValue] ?? WARN_BODY.other;
}

const BAN_BODY = {
    spam:
        'Your Connectly account has been permanently banned for spam or scams (e.g. phishing, fake engagement, or repeated unsolicited commercial abuse). You can no longer sign in.\n\nIf you believe this is a mistake, you may appeal using the link on this page.',
    harassment:
        'Your Connectly account has been permanently banned for harassment or bullying. You can no longer sign in.\n\nIf you believe this is a mistake, you may appeal using the link on this page.',
    hate_speech:
        'Your Connectly account has been permanently banned for hate speech. You can no longer sign in.\n\nIf you believe this is a mistake, you may appeal using the link on this page.',
    violence:
        'Your Connectly account has been permanently banned for violence or threats. You can no longer sign in.\n\nIf you believe this is a mistake, you may appeal using the link on this page.',
    sexual_content:
        'Your Connectly account has been permanently banned for sexual content that violates our rules. You can no longer sign in.\n\nIf you believe this is a mistake, you may appeal using the link on this page.',
    misinformation:
        'Your Connectly account has been permanently banned for repeated or severe misinformation that violates our policies. You can no longer sign in.\n\nIf you believe this is a mistake, you may appeal using the link on this page.',
    impersonation:
        'Your Connectly account has been permanently banned for impersonation. You can no longer sign in.\n\nIf you believe this is a mistake, you may appeal using the link on this page.',
    intellectual_property:
        'Your Connectly account has been permanently banned for copyright or trademark violations. You can no longer sign in.\n\nIf you believe this is a mistake, you may appeal using the link on this page.',
    self_harm:
        'Your Connectly account has been permanently banned for content related to self-harm that violates our policies. You can no longer sign in.\n\nIf you believe this is a mistake, you may appeal using the link on this page.',
    inappropriate:
        'Your Connectly account has been permanently banned for posting sensitive or disturbing content that violates our community standards. You can no longer sign in.\n\nIf you believe this is a mistake, you may appeal using the link on this page.',
    other:
        'Your Connectly account has been permanently banned for serious or repeated violations of our community standards. You can no longer sign in.\n\nIf you believe this is a mistake, you may appeal using the link on this page.',
};

/**
 * Prefilled ban message to the user — same reason taxonomy as warnings / reports.
 */
export function getBanMessageTemplate(reasonValue) {
    return BAN_BODY[reasonValue] ?? BAN_BODY.other;
}

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
