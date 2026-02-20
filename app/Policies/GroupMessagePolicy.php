<?php

namespace App\Policies;

use App\Models\GroupMessage;
use App\Models\User;

class GroupMessagePolicy
{
    public function update(User $user, GroupMessage $groupMessage): bool
    {
        if ((int) $user->id !== (int) $groupMessage->sender_id) {
            return false;
        }

        if ($groupMessage->trashed()) {
            return false;
        }

        return $groupMessage->groupConversation->isMember($user);
    }

    public function delete(User $user, GroupMessage $groupMessage): bool
    {
        if ((int) $user->id !== (int) $groupMessage->sender_id) {
            return false;
        }

        return $groupMessage->groupConversation->isMember($user);
    }
}
