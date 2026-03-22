<?php

namespace App\Notifications;

use App\Models\Report;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Sent to the person who filed a report when moderation updates the case.
 */
class ReportOutcomeNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Report $report,
        /** dismissed | resolved | content_removed */
        public string $outcome
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray(object $notifiable): array
    {
        $message = match ($this->outcome) {
            'dismissed' => $this->dismissalMessageForReporter(),
            'resolved' => 'Thanks — we reviewed your report and took moderation action.',
            'content_removed' => 'We removed the content you reported after review.',
            default => 'Your report was updated.',
        };

        $reasonLabel = null;
        if ($this->outcome === 'dismissed' && $this->report->dismissal_reason) {
            $reasonLabel = self::reasonLabelForCode($this->report->dismissal_reason);
        }

        return [
            'type' => 'report_outcome',
            'message' => $message,
            'report_id' => $this->report->id,
            'outcome' => $this->outcome,
            'reason_label' => $reasonLabel,
        ];
    }

    /**
     * Same category labels as frontend `REPORT_REASONS` (user report flow).
     */
    private static function reasonLabelForCode(string $code): string
    {
        return match ($code) {
            'spam' => 'Spam or scams',
            'harassment' => 'Harassment or bullying',
            'hate_speech' => 'Hate speech',
            'violence' => 'Violence or threats',
            'sexual_content' => 'Nudity or sexual content',
            'misinformation' => 'False or misleading information',
            'impersonation' => 'Impersonation',
            'intellectual_property' => 'Copyright or trademark',
            'self_harm' => 'Self-harm or suicide',
            'inappropriate' => 'Sensitive or disturbing content',
            'other' => 'Something else',
            default => $code,
        };
    }

    private function dismissalMessageForReporter(): string
    {
        $custom = $this->report->dismissal_message;
        if (is_string($custom) && trim($custom) !== '') {
            return trim($custom);
        }

        return 'We reviewed your report and closed it with no further action.';
    }
}
