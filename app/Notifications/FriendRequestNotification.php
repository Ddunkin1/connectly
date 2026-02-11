<?php

namespace App\Notifications;

use App\Models\FriendRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class FriendRequestNotification extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public FriendRequest $friendRequest
    ) {
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('New Friend Request')
            ->line($this->friendRequest->sender->name . ' sent you a friend request.')
            ->action('View Request', url('/notifications'))
            ->line('Thank you for using our application!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'friend_request',
            'friend_request_id' => $this->friendRequest->id,
            'sender_id' => $this->friendRequest->sender_id,
            'sender_name' => $this->friendRequest->sender->name,
            'sender_username' => $this->friendRequest->sender->username,
            'sender_profile_picture' => $this->friendRequest->sender->profile_picture,
            'message' => $this->friendRequest->sender->name . ' sent you a friend request',
        ];
    }
}
