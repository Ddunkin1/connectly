<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class WarningAppealAnsweredNotification extends Notification
{
    use Queueable;

    public function __construct(
        public string $adminReply,
        public ?int $moderationEventId = null
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'warning_appeal_answered',
            'message' => 'Your appeal received a response from the moderation team.',
            'detail' => $this->adminReply,
            'moderation_event_id' => $this->moderationEventId,
        ];
    }
}
