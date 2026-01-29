<?php

namespace App\Services;

use App\Models\Post;
use App\Models\User;
use App\Notifications\MentionNotification;

class MentionService
{
    /**
     * Extract usernames from text (e.g. @johndoe).
     */
    public function extractMentionedUsernames(string $text): array
    {
        if (empty(trim($text))) {
            return [];
        }

        preg_match_all('/@([a-zA-Z0-9_]+)/', $text, $matches);

        return array_unique($matches[1] ?? []);
    }

    /**
     * Notify users mentioned in content.
     */
    public function notifyMentionedUsers(string $content, Post $post, User $author, string $context = 'post'): void
    {
        $usernames = $this->extractMentionedUsernames($content);

        if (empty($usernames)) {
            return;
        }

        $users = User::whereIn('username', $usernames)
            ->where('id', '!=', $author->id)
            ->get();

        foreach ($users as $user) {
            $user->notify(new MentionNotification($post, $author, $context));
        }
    }
}
