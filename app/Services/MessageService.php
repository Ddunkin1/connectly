<?php

namespace App\Services;

use App\Events\MessageReceived;
use App\Events\MessageSent;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class MessageService
{
    /**
     * Send a message in a conversation.
     */
    public function sendMessage(Conversation $conversation, User $sender, string $message): Message
    {
        // Determine receiver
        $receiver = $conversation->getOtherUser($sender);

        // Create message
        $messageModel = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $sender->id,
            'receiver_id' => $receiver->id,
            'message' => $message,
        ]);

        // Update conversation's last_message_at
        $conversation->update([
            'last_message_at' => now(),
        ]);

        $messageModel->load(['sender', 'receiver']);
        broadcast(new MessageSent($messageModel))->toOthers();
        // Notify receiver on their user channel so they get it anywhere in the app
        broadcast(new MessageReceived($messageModel));

        return $messageModel;
    }

    /**
     * Get messages for a conversation.
     */
    public function getMessages(Conversation $conversation, int $perPage = 50): LengthAwarePaginator
    {
        return Message::where('conversation_id', $conversation->id)
            ->with(['sender', 'receiver'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Mark all messages in a conversation as read for a user.
     */
    public function markAsRead(Conversation $conversation, User $user): void
    {
        $conversation->markAsReadFor($user);
    }

    /**
     * Get total unread messages count for a user.
     */
    public function getUnreadCount(User $user): int
    {
        return $user->unreadMessagesCount();
    }
}
