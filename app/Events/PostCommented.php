<?php

namespace App\Events;

use App\Http\Resources\CommentResource;
use App\Models\Comment;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PostCommented implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $postId,
        public int $commentsCount,
        public Comment $comment
    ) {
        $this->comment->load(['user', 'replies']);
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('post-updates'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'PostCommented';
    }

    public function broadcastWith(): array
    {
        return [
            'post_id' => $this->postId,
            'comments_count' => $this->commentsCount,
            'comment' => (new CommentResource($this->comment))->resolve(),
        ];
    }
}
