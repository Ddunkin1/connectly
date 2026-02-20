<?php

namespace App\Policies;

use App\Models\Message;
use App\Models\User;

class MessagePolicy
{
    public function update(User $user, Message $message): bool
    {
        if ((int) $user->id !== (int) $message->sender_id) {
            return false;
        }

        if ($message->trashed()) {
            return false;
        }

        return (int) $message->conversation->user_one_id === (int) $user->id
            || (int) $message->conversation->user_two_id === (int) $user->id;
    }

    public function delete(User $user, Message $message): bool
    {
        if ((int) $user->id !== (int) $message->sender_id) {
            return false;
        }

        return (int) $message->conversation->user_one_id === (int) $user->id
            || (int) $message->conversation->user_two_id === (int) $user->id;
    }
}
