<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class AccountBannedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public ?string $note = null,
        public ?string $reasonCode = null
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'account_banned',
            'message' => 'Your account was permanently banned from Connectly.',
            'reason_code' => $this->reasonCode,
            'reason_label' => $this->reasonLabel($this->reasonCode),
            'detail' => $this->note ?: 'If you think this was a mistake, contact support.',
        ];
    }

    private function reasonLabel(?string $code): ?string
    {
        if ($code === null || $code === '') {
            return null;
        }

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
}
