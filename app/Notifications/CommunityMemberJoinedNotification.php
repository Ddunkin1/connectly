<?php

namespace App\Notifications;

use App\Models\Community;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class CommunityMemberJoinedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Community $community,
        public User $user
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'community_member_joined',
            'community_id' => $this->community->id,
            'community_name' => $this->community->name,
            'user_id' => $this->user->id,
            'user_name' => $this->user->name,
            'user_username' => $this->user->username,
            'user_profile_picture' => $this->user->profile_picture,
            'message' => $this->user->name . ' joined ' . $this->community->name,
        ];
    }
}
