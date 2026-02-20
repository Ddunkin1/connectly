<?php

namespace App\Events;

use App\Http\Resources\GroupMessageResource;
use App\Models\GroupMessage;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GroupMessageUpdated implements ShouldBroadcastNow
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
        return 'GroupMessageUpdated';
    }

    public function broadcastWith(): array
    {
        return [
            'message' => (new GroupMessageResource($this->groupMessage))->resolve(),
        ];
    }
}
