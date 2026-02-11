<?php

namespace App\Notifications;

use App\Models\Post;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MentionNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Post $post,
        public User $mentionedBy,
        public string $context = 'post' // 'post' or 'comment'
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $action = $this->context === 'comment' ? 'mentioned you in a comment' : 'mentioned you in a post';
        return (new MailMessage)
            ->subject('You were mentioned')
            ->line($this->mentionedBy->name . ' ' . $action . '.')
            ->action('View Post', url('/posts/' . $this->post->id))
            ->line('Thank you for using our application!');
    }

    public function toArray(object $notifiable): array
    {
        $preview = $this->post->content
            ? \Str::limit(strip_tags($this->post->content), 80)
            : 'a post';

        $message = $this->context === 'comment'
            ? $this->mentionedBy->name . ' mentioned you in a comment'
            : $this->mentionedBy->name . ' mentioned you in a post';

        return [
            'type' => 'mention',
            'post_id' => $this->post->id,
            'actor_id' => $this->mentionedBy->id,
            'actor_name' => $this->mentionedBy->name,
            'actor_username' => $this->mentionedBy->username,
            'actor_profile_picture' => $this->mentionedBy->profile_picture,
            'message' => $message,
            'post_preview' => $preview,
            'context' => $this->context,
            'media_url' => $this->post->media_url,
            'media_type' => $this->post->media_type,
            'likes_count' => $this->post->likes()->count(),
            'comments_count' => $this->post->allComments()->count(),
        ];
    }
}
