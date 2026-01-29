<?php

namespace App\Notifications;

use App\Models\Post;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LikeNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Post $post,
        public User $liker
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('New Like')
            ->line($this->liker->name . ' liked your post.')
            ->action('View Post', url('/posts/' . $this->post->id))
            ->line('Thank you for using our application!');
    }

    public function toArray(object $notifiable): array
    {
        $preview = $this->post->content
            ? \Str::limit(strip_tags($this->post->content), 80)
            : 'your post';

        return [
            'type' => 'like',
            'post_id' => $this->post->id,
            'actor_id' => $this->liker->id,
            'actor_name' => $this->liker->name,
            'actor_username' => $this->liker->username,
            'actor_profile_picture' => $this->liker->profile_picture,
            'message' => $this->liker->name . ' liked your post',
            'post_preview' => $preview,
        ];
    }
}
