<?php

namespace App\Services;

use App\Events\MessageReceived;
use App\Events\MessageSent;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class MessageService
{
    public function __construct(
        private SupabaseService $supabaseService
    ) {
    }

    /**
     * Send a message in a conversation.
     *
     * @param array{attachment_url?: string|null, attachment_type?: string|null} $options
     */
    public function sendMessage(Conversation $conversation, User $sender, string $message, array $options = []): Message
    {
        // Determine receiver
        $receiver = $conversation->getOtherUser($sender);

        $data = [
            'conversation_id' => $conversation->id,
            'sender_id' => $sender->id,
            'receiver_id' => $receiver->id,
            'message' => $message,
        ];

        if (! empty($options['attachment_url'])) {
            $data['attachment_url'] = $options['attachment_url'];
            $data['attachment_type'] = $options['attachment_type'] ?? 'image';
        }

        $messageModel = Message::create($data);

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
            ->withTrashed()
            ->with(['sender', 'receiver'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Update message text and optionally replace attachment.
     */
    public function updateMessage(Message $message, ?string $text, ?UploadedFile $media = null): Message
    {
        return DB::transaction(function () use ($message, $text, $media) {
            $updates = [];
            $trimmed = is_string($text) ? trim($text) : null;
            $oldAttachmentUrl = $message->attachment_url;

            if ($text !== null) {
                $updates['message'] = $trimmed;
            }

            if ($media) {
                $url = $this->supabaseService->uploadFile($media, 'message-attachments');
                $mime = $media->getMimeType();
                $type = str_starts_with((string) $mime, 'video/') ? 'video' : (str_starts_with((string) $mime, 'image/') ? 'image' : 'file');
                $updates['attachment_url'] = $url;
                $updates['attachment_type'] = $type;
            }

            $hasChanges = false;
            foreach ($updates as $field => $value) {
                if ($message->{$field} !== $value) {
                    $hasChanges = true;
                    break;
                }
            }

            if (! $hasChanges) {
                return $message->fresh(['sender', 'receiver']);
            }

            $updates['edited_at'] = now();
            $message->update($updates);

            if ($media && ! empty($oldAttachmentUrl) && $oldAttachmentUrl !== $message->attachment_url) {
                $this->supabaseService->deleteFile($oldAttachmentUrl);
            }

            return $message->fresh(['sender', 'receiver']);
        });
    }

    /**
     * Soft-delete a message and clear text/media payload.
     */
    public function deleteMessage(Message $message, User $actor): Message
    {
        return DB::transaction(function () use ($message, $actor) {
            if ($message->trashed()) {
                return Message::withTrashed()
                    ->with(['sender', 'receiver'])
                    ->findOrFail($message->id);
            }

            $oldAttachmentUrl = $message->attachment_url;
            $message->update([
                'message' => null,
                'attachment_url' => null,
                'attachment_type' => null,
                'deleted_by' => $actor->id,
            ]);
            $message->delete();

            if (! empty($oldAttachmentUrl)) {
                $this->supabaseService->deleteFile($oldAttachmentUrl);
            }

            return Message::withTrashed()
                ->with(['sender', 'receiver'])
                ->findOrFail($message->id);
        });
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
