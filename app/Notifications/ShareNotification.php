<?php

namespace App\Notifications;

use App\Models\Post;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ShareNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Post $post,
        public User $sharer
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Your post was shared')
            ->line($this->sharer->name . ' shared your post.')
            ->action('View Post', url('/posts/' . $this->post->id))
            ->line('Thank you for using our application!');
    }

    public function toArray(object $notifiable): array
    {
        $preview = $this->post->content
            ? \Str::limit(strip_tags($this->post->content), 80)
            : 'your post';

        return [
            'type' => 'share',
            'post_id' => $this->post->id,
            'actor_id' => $this->sharer->id,
            'actor_name' => $this->sharer->name,
            'actor_username' => $this->sharer->username,
            'actor_profile_picture' => $this->sharer->profile_picture,
            'message' => $this->sharer->name . ' shared your post',
            'post_preview' => $preview,
            'likes_count' => $this->post->likes()->count(),
            'comments_count' => $this->post->allComments()->count(),
            'shares_count' => $this->post->shares_count ?? 0,
            'media_url' => $this->post->media_url,
            'media_type' => $this->post->media_type,
        ];
    }
}
