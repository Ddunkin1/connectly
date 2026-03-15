<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PostLiked implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $postId,
        public int $likesCount
    ) {
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('post-updates'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'PostLiked';
    }

    public function broadcastWith(): array
    {
        return [
            'post_id' => $this->postId,
            'likes_count' => $this->likesCount,
        ];
    }
}
