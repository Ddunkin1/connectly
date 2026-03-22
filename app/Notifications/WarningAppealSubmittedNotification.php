<?php

namespace App\Notifications;

use App\Models\WarningAppeal;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Notifies admins when a user appeals a formal warning.
 */
class WarningAppealSubmittedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public WarningAppeal $appeal
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
            'type' => 'warning_appeal_submitted',
            'message' => 'A user appealed a moderation warning.',
            'appeal_id' => $this->appeal->id,
            'moderation_event_id' => $event?->id,
            'user_id' => $user?->id,
            'username' => $user?->username,
            'reason_code' => $event?->reason_code,
            'appeal_preview' => \Str::limit($this->appeal->message, 160),
        ];
    }
}
