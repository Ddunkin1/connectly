<?php

namespace App\Notifications;

use App\Models\BanAppeal;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Notifies admins when a user appeals an account ban.
 */
class BanAppealSubmittedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public BanAppeal $appeal
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray(object $notifiable): array
    {
        $user = $this->appeal->user;
        $event = $this->appeal->moderationEvent;

        return [
            'type' => 'ban_appeal_submitted',
            'message' => 'A user appealed an account ban.',
            'appeal_id' => $this->appeal->id,
            'moderation_event_id' => $event?->id,
            'user_id' => $user?->id,
            'username' => $user?->username,
            'reason_code' => $event?->reason_code,
            'appeal_preview' => \Str::limit($this->appeal->message, 160),
        ];
    }
}

