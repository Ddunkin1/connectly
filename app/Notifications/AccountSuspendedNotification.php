<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Sent when an admin suspends the account (timed or indefinite).
 */
class AccountSuspendedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public ?\DateTimeInterface $until
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray(object $notifiable): array
    {
        $msg = $this->until === null
            ? 'Your account was suspended. You cannot sign in until a moderator lifts this suspension.'
            : 'Your account was suspended until ' . $this->until->format('Y-m-d H:i') . ' UTC.';

        return [
            'type' => 'account_suspended',
            'message' => $msg,
            'detail' => 'If you think this was a mistake, contact support.',
            'suspended_until' => $this->until?->toIso8601String(),
        ];
    }
}
