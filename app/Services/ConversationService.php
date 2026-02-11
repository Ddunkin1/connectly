<?php

namespace App\Services;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class ConversationService
{
    /**
     * Get or create a conversation between two users.
     */
    public function getOrCreateConversation(User $user1, User $user2): Conversation
    {
        // Ensure consistent ordering (smaller ID first)
        $ids = [$user1->id, $user2->id];
        sort($ids);
        
        $conversation = Conversation::where(function ($query) use ($ids) {
            $query->where('user_one_id', $ids[0])
                  ->where('user_two_id', $ids[1]);
        })->first();

        if (!$conversation) {
            $conversation = Conversation::create([
                'user_one_id' => $ids[0],
                'user_two_id' => $ids[1],
            ]);
        }

        return $conversation->load(['userOne', 'userTwo']);
    }

    /**
     * Get all conversations for a user with last message and unread count.
     */
    public function getUserConversations(User $user, int $perPage = 20): LengthAwarePaginator
    {
        $conversations = Conversation::forUser($user)
            ->with(['userOne', 'userTwo'])
            ->withCount([
                'messages as unread_count' => function ($query) use ($user) {
                    $query->where('receiver_id', $user->id)
                          ->where('is_read', false);
                }
            ])
            ->with(['messages' => function ($query) {
                $query->latest()->limit(1);
            }])
            ->orderBy('last_message_at', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        // Eager load last message for each conversation
        $conversations->getCollection()->transform(function ($conversation) {
            $conversation->last_message = $conversation->messages->first();
            return $conversation;
        });

        return $conversations;
    }

    /**
     * Get a specific conversation if user is a participant.
     */
    public function getConversation(User $user, int $conversationId): ?Conversation
    {
        $conversation = Conversation::with(['userOne', 'userTwo'])
            ->forUser($user)
            ->find($conversationId);

        return $conversation;
    }
}
