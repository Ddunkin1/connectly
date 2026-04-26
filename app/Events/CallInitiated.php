<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CallInitiated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int    $recipientId,
        public int    $callerId,
        public string $callerName,
        public string $callerAvatar,
        public string $channelName,
        public int    $conversationId,
        public string $callType = 'video',
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->recipientId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'CallInitiated';
    }

    public function broadcastWith(): array
    {
        return [
            'caller_id'       => $this->callerId,
            'caller_name'     => $this->callerName,
            'caller_avatar'   => $this->callerAvatar,
            'channel_name'    => $this->channelName,
            'conversation_id' => $this->conversationId,
            'call_type'       => $this->callType,
        ];
    }
}
