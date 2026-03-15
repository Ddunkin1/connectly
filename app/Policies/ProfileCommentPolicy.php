<?php

namespace App\Policies;

use App\Models\ProfileComment;
use App\Models\User;

class ProfileCommentPolicy
{
    /**
     * Author can update their own comment.
     */
    public function update(User $user, ProfileComment $profileComment): bool
    {
        return $user->id === $profileComment->author_id;
    }

    /**
     * Profile owner can hide comments on their profile.
     */
    public function hide(User $user, ProfileComment $profileComment): bool
    {
        return $user->id === $profileComment->user_id;
    }

    /**
     * Author or profile owner can delete.
     */
    public function delete(User $user, ProfileComment $profileComment): bool
    {
        return $user->id === $profileComment->author_id
            || $user->id === $profileComment->user_id;
    }
}
