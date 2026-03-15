<?php

namespace App\Notifications;

use App\Models\CommunityJoinRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class CommunityJoinRequestNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public CommunityJoinRequest $joinRequest
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray(object $notifiable): array
    {
        $user = $this->joinRequest->user;
        $community = $this->joinRequest->community;
        return [
            'type' => 'community_join_request',
            'community_id' => $community->id,
            'community_name' => $community->name,
            'join_request_id' => $this->joinRequest->id,
            'user_id' => $user->id,
            'user_name' => $user->name,
            'user_username' => $user->username,
            'user_profile_picture' => $user->profile_picture,
            'message' => $user->name . ' requested to join ' . $community->name,
        ];
    }
}
