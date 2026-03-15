<?php

namespace App\Notifications;

use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CommentLikeNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Post $post,
        public Comment $comment,
        public User $liker
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $actorName = $this->liker->name ?? 'Someone';
        return (new MailMessage)
            ->subject('New like on your comment')
            ->line($actorName . ' liked your comment.')
            ->action('View Post', url('/post/' . $this->post->id))
            ->line('Thank you for using our application!');
    }

    public function toArray(object $notifiable): array
    {
        $actorName = $this->liker->name ?? 'Someone';
        $commentPreview = $this->comment->content
            ? \Str::limit(strip_tags($this->comment->content), 80)
            : '';
        $postPreview = $this->post->content
            ? \Str::limit(strip_tags($this->post->content), 80)
            : null;

        return [
            'type' => 'comment_like',
            'post_id' => $this->post->id,
            'comment_id' => $this->comment->id,
            'actor_id' => $this->liker->id,
            'actor_name' => $actorName,
            'actor_username' => $this->liker->username ?? null,
            'actor_profile_picture' => $this->liker->profile_picture ?? null,
            'message' => $actorName . ' liked your comment',
            'comment_preview' => $commentPreview,
            'post_preview' => $postPreview,
            'likes_count' => $this->comment->likes()->count(),
            'media_url' => $this->post->media_url ?? null,
            'media_type' => $this->post->media_type ?? null,
        ];
    }
}
