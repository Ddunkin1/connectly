<?php

namespace App\Notifications;

use App\Models\Report;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Warning to the author when a post is removed by moderators.
 */
class ContentRemovedByModerationNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Report $report
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'moderation_content_removed',
            'message' => 'A post you published was removed because it broke our community guidelines.',
            'detail' => 'Repeated violations may lead to longer restrictions on your account.',
            'report_id' => $this->report->id,
        ];
    }
}
