<?php

namespace App\Notifications;

use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CommentPinnedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Post $post,
        public Comment $comment,
        public User $pinnedBy
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $actorName = $this->pinnedBy->name ?? 'Someone';
        return (new MailMessage)
            ->subject('Your comment was pinned')
            ->line($actorName . ' pinned your comment on their post.')
            ->action('View Post', url('/post/' . $this->post->id))
            ->line('Thank you for using our application!');
    }

    public function toArray(object $notifiable): array
    {
        $actorName = $this->pinnedBy->name ?? 'Someone';
        $commentPreview = $this->comment->content
            ? \Str::limit(strip_tags($this->comment->content), 80)
            : '';
        $postPreview = $this->post->content
            ? \Str::limit(strip_tags($this->post->content), 80)
            : null;

        return [
            'type' => 'comment_pinned',
            'post_id' => $this->post->id,
            'comment_id' => $this->comment->id,
            'actor_id' => $this->pinnedBy->id,
            'actor_name' => $actorName,
            'actor_username' => $this->pinnedBy->username ?? null,
            'actor_profile_picture' => $this->pinnedBy->profile_picture ?? null,
            'message' => $actorName . ' pinned your comment',
            'comment_preview' => $commentPreview,
            'post_preview' => $postPreview,
            'media_url' => $this->post->media_url ?? null,
            'media_type' => $this->post->media_type ?? null,
        ];
    }
}
