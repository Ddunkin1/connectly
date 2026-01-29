<?php

namespace App\Notifications;

use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CommentNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Post $post,
        public Comment $comment,
        public User $commenter
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('New Comment')
            ->line($this->commenter->name . ' commented on your post.')
            ->action('View Post', url('/posts/' . $this->post->id))
            ->line('Thank you for using our application!');
    }

    public function toArray(object $notifiable): array
    {
        $contentPreview = \Str::limit(strip_tags($this->comment->content), 80);

        return [
            'type' => 'comment',
            'post_id' => $this->post->id,
            'comment_id' => $this->comment->id,
            'actor_id' => $this->commenter->id,
            'actor_name' => $this->commenter->name,
            'actor_username' => $this->commenter->username,
            'actor_profile_picture' => $this->commenter->profile_picture,
            'message' => $this->commenter->name . ' commented on your post',
            'comment_preview' => $contentPreview,
        ];
    }
}
