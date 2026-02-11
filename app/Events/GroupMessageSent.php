<?php

namespace App\Events;

use App\Models\GroupMessage;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GroupMessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public GroupMessage $groupMessage
    ) {
        $this->groupMessage->load('sender');
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('group-conversation.' . $this->groupMessage->group_conversation_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'GroupMessageSent';
    }

    public function broadcastWith(): array
    {
        return [
            'message' => [
                'id' => $this->groupMessage->id,
                'group_conversation_id' => $this->groupMessage->group_conversation_id,
                'sender_id' => $this->groupMessage->sender_id,
                'content' => $this->groupMessage->content,
                'created_at' => $this->groupMessage->created_at?->toISOString(),
                'sender' => $this->groupMessage->sender ? [
                    'id' => $this->groupMessage->sender->id,
                    'name' => $this->groupMessage->sender->name,
                    'username' => $this->groupMessage->sender->username,
                    'profile_picture' => $this->groupMessage->sender->profile_picture,
                ] : null,
            ],
        ];
    }
}
