<?php

namespace App\Notifications;

use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CommentReplyNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Post $post,
        public Comment $parentComment,
        public Comment $reply,
        public User $replier
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $actorName = $this->replier->name ?? 'Someone';
        return (new MailMessage)
            ->subject('New reply to your comment')
            ->line($actorName . ' replied to your comment.')
            ->action('View Post', url('/post/' . $this->post->id))
            ->line('Thank you for using our application!');
    }

    public function toArray(object $notifiable): array
    {
        $actorName = $this->replier->name ?? 'Someone';
        $replyPreview = $this->reply->content
            ? \Str::limit(strip_tags($this->reply->content), 80)
            : '';
        $parentPreview = $this->parentComment->content
            ? \Str::limit(strip_tags($this->parentComment->content), 80)
            : '';
        $postPreview = $this->post->content
            ? \Str::limit(strip_tags($this->post->content), 80)
            : null;

        return [
            'type' => 'comment_reply',
            'post_id' => $this->post->id,
            'comment_id' => $this->reply->id,
            'parent_comment_id' => $this->parentComment->id,
            'actor_id' => $this->replier->id,
            'actor_name' => $actorName,
            'actor_username' => $this->replier->username ?? null,
            'actor_profile_picture' => $this->replier->profile_picture ?? null,
            'message' => $actorName . ' replied to your comment',
            'comment_preview' => $replyPreview,
            'parent_comment_preview' => $parentPreview,
            'post_preview' => $postPreview,
            'media_url' => $this->post->media_url ?? null,
            'media_type' => $this->post->media_type ?? null,
        ];
    }
}
