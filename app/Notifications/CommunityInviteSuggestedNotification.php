<?php

namespace App\Notifications;

use App\Models\CommunityInvite;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class CommunityInviteSuggestedNotification extends Notification implements ShouldQueue
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
        $invited = $this->invite->invitedUser;
        $community = $this->invite->community;
        return [
            'type' => 'community_invite_suggested',
            'community_invite_id' => $this->invite->id,
            'community_id' => $community->id,
            'community_name' => $community->name,
            'inviter_id' => $inviter->id,
            'inviter_name' => $inviter->name,
            'inviter_username' => $inviter->username,
            'invited_user_id' => $invited->id,
            'invited_user_name' => $invited->name,
            'invited_user_username' => $invited->username,
            'message' => $inviter->name . ' suggested inviting ' . $invited->name . ' to ' . $community->name,
        ];
    }
}
