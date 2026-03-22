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
            'dismissed' => 'We reviewed your report and closed it with no further action.',
            'resolved' => 'Thanks — we took action and marked your report as resolved.',
            'content_removed' => 'We removed the content you reported after review.',
            default => 'Your report was updated.',
        };

        return [
            'type' => 'report_outcome',
            'message' => $message,
            'report_id' => $this->report->id,
            'outcome' => $this->outcome,
        ];
    }
}
