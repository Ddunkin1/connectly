<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class BanAppealAnsweredNotification extends Notification
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
            'type' => 'ban_appeal_answered',
            'message' => 'Your ban appeal received a response from the moderation team.',
            'detail' => $this->adminReply,
            'moderation_event_id' => $this->moderationEventId,
        ];
    }
}

