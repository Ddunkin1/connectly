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

        if (! empty($options['post_id'])) {
            $data['post_id'] = $options['post_id'];
        }

        $messageModel = Message::create($data);

        // Update conversation's last_message_at
        $conversation->update([
            'last_message_at' => now(),
        ]);

        $messageModel->load(['sender', 'receiver', 'post.user']);
        try {
            broadcast(new MessageSent($messageModel))->toOthers();
            broadcast(new MessageReceived($messageModel));
        } catch (\Throwable $e) {
            \Log::warning('Broadcast failed for message ' . $messageModel->id . ': ' . $e->getMessage());
        }

        return $messageModel;
    }

    /**
     * Get messages for a conversation.
     */
    public function getMessages(Conversation $conversation, int $perPage = 50): LengthAwarePaginator
    {
        return Message::where('conversation_id', $conversation->id)
            ->withTrashed()
            ->with(['sender', 'receiver', 'post.user'])
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
                // Keep `messages.message` non-null (DB column is NOT NULL).
                // UI uses `is_deleted` to show a "This message was deleted" placeholder.
                'message' => '',
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
     * Pin a message in a conversation.
     */
    public function pinMessage(Message $message, User $actor): Message
    {
        $message->update([
            'is_pinned' => true,
            'pinned_at' => now(),
        ]);

        return $message->fresh(['sender', 'receiver']);
    }

    /**
     * Unpin a previously pinned message.
     */
    public function unpinMessage(Message $message, User $actor): Message
    {
        $message->update([
            'is_pinned' => false,
            'pinned_at' => null,
        ]);

        return $message->fresh(['sender', 'receiver']);
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
