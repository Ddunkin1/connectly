<?php

use App\Models\Conversation;
use App\Models\GroupConversation;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('conversation.{conversationId}', function ($user, $conversationId) {
    return Conversation::where('id', $conversationId)
        ->where(function ($q) use ($user) {
            $q->where('user_one_id', $user->id)
                ->orWhere('user_two_id', $user->id);
        })
        ->exists();
});

Broadcast::channel('group-conversation.{groupId}', function ($user, $groupId) {
    $group = GroupConversation::find($groupId);
    return $group && $group->isMember($user);
});

Broadcast::channel('post-updates', function ($user) {
    return $user !== null;
});

// Video call signaling — only the user themselves can auth for their own channel
Broadcast::channel('user.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});
