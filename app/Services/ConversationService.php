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
    public function getOrCreateConversation(User $user1, User $user2): ?Conversation
    {
        // Prevent conversation if either user has blocked the other
        if ($user1->hasBlocked($user2) || $user2->hasBlocked($user1)) {
            return null;
        }

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
        } else {
            // Un-hide for the user who is actively re-opening the conversation
            if ($user1->id === $ids[0] && $conversation->hidden_by_user_one) {
                $conversation->update(['hidden_by_user_one' => false]);
            } elseif ($user1->id === $ids[1] && $conversation->hidden_by_user_two) {
                $conversation->update(['hidden_by_user_two' => false]);
            }
        }

        return $conversation->load(['userOne', 'userTwo']);
    }

    /**
     * Get all conversations for a user with last message and unread count.
     */
    public function getUserConversations(User $user, int $perPage = 20): LengthAwarePaginator
    {
        $blockedIds = array_merge($user->blockedUserIds(), $user->blockedByUserIds());

        $query = Conversation::forUser($user);
        if (!empty($blockedIds)) {
            $query->whereNotIn('user_one_id', $blockedIds)
                  ->whereNotIn('user_two_id', $blockedIds);
        }

        // Filter out conversations the user has hidden
        $query->where(function ($q) use ($user) {
            $q->where(function ($q2) use ($user) {
                $q2->where('user_one_id', $user->id)->where('hidden_by_user_one', false);
            })->orWhere(function ($q2) use ($user) {
                $q2->where('user_two_id', $user->id)->where('hidden_by_user_two', false);
            });
        });

        $conversations = $query
            ->with(['userOne', 'userTwo'])
            ->withCount([
                'messages as unread_count' => function ($query) use ($user) {
                    $query->where('receiver_id', $user->id)
                          ->whereNull('deleted_at')
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
