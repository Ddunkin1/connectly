<?php

namespace App\Policies;

use App\Models\Community;
use App\Models\User;

class CommunityPolicy
{
    /**
     * Determine if the user can update the community.
     */
    public function update(User $user, Community $community): bool
    {
        return $user->id === $community->creator_id;
    }

    /**
     * Determine if the user can delete the community.
     */
    public function delete(User $user, Community $community): bool
    {
        return $user->id === $community->creator_id;
    }
}
