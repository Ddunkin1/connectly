<?php

namespace App\Notifications;

use App\Models\Post;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ModerationWarningNotification extends Notification
{
    use Queueable;

    public function __construct(
        public string $reasonCode,
        public string $messageBody,
        public ?int $postId = null,
        public ?int $moderationEventId = null
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray(object $notifiable): array
    {
        $postPreview = null;
        $postMediaUrl = null;
        if ($this->postId !== null) {
            $post = Post::query()->find($this->postId);
            if ($post) {
                $postPreview = \Str::limit((string) $post->content, 220);
                $postMediaUrl = $post->media_url;
            }
        }

        return [
            'type' => 'moderation_warning',
            'message' => 'A moderator sent you a warning about your account.',
            'detail' => $this->messageBody,
            'reason_code' => $this->reasonCode,
            'reason_label' => self::reasonLabel($this->reasonCode),
            'post_id' => $this->postId,
            'post_preview' => $postPreview,
            'post_media_url' => $postMediaUrl,
            'moderation_event_id' => $this->moderationEventId,
        ];
    }

    private static function reasonLabel(string $code): string
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
            default => str_replace('_', ' ', $code),
        };
    }
}
