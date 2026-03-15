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
        return ['database', 'broadcast'];
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

        $likesCount = $this->post->likes()->count();
        $recentLikers = $this->post->likes()
            ->with('user:id,name,username,profile_picture')
            ->latest()
            ->limit(3)
            ->get()
            ->map(fn ($like) => $like->user ? [
                'id' => $like->user->id,
                'name' => $like->user->name ?? 'Unknown',
                'username' => $like->user->username ?? null,
                'profile_picture' => $like->user->profile_picture ?? null,
            ] : null)
            ->filter()
            ->values()
            ->toArray();

        $actorName = $this->liker->name ?? 'Someone';
        return [
            'type' => 'like',
            'post_id' => $this->post->id,
            'actor_id' => $this->liker->id,
            'actor_name' => $actorName,
            'actor_username' => $this->liker->username ?? null,
            'actor_profile_picture' => $this->liker->profile_picture ?? null,
            'message' => $actorName . ' liked your post',
            'post_preview' => $preview,
            'likes_count' => $likesCount,
            'recent_likers' => $recentLikers,
            'media_url' => $this->post->media_url ?? null,
            'media_type' => $this->post->media_type ?? null,
            'comments_count' => $this->post->allComments()->count(),
        ];
    }
}
