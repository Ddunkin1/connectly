<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class FriendRequestAcceptedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public User $accepter
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Friend Request Accepted')
            ->line($this->accepter->name . ' accepted your friend request.')
            ->action('View Profile', url('/profile/' . $this->accepter->username))
            ->line('Thank you for using our application!');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'friend_request_accepted',
            'actor_id' => $this->accepter->id,
            'actor_name' => $this->accepter->name,
            'actor_username' => $this->accepter->username,
            'actor_profile_picture' => $this->accepter->profile_picture,
            'message' => $this->accepter->name . ' accepted your friend request',
        ];
    }
}
