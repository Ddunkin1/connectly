<?php

namespace App\Notifications;

use App\Models\Community;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class CommunityJoinRequestRejectedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Community $community
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'community_join_request_rejected',
            'community_id' => $this->community->id,
            'community_name' => $this->community->name,
            'message' => 'Your request to join ' . $this->community->name . ' was declined',
        ];
    }
}
