<?php

namespace App\Notifications;

use App\Models\CommunityInvite;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class CommunityInviteNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public CommunityInvite $invite
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray(object $notifiable): array
    {
        $inviter = $this->invite->inviter;
        $community = $this->invite->community;
        return [
            'type' => 'community_invite',
            'community_invite_id' => $this->invite->id,
            'community_id' => $community->id,
            'community_name' => $community->name,
            'inviter_id' => $inviter->id,
            'inviter_name' => $inviter->name,
            'inviter_username' => $inviter->username,
            'inviter_profile_picture' => $inviter->profile_picture,
            'message' => $inviter->name . ' invited you to join ' . $community->name,
        ];
    }
}
