<?php

namespace App\Services;

use App\Models\Story;
use App\Models\User;
use Illuminate\Support\Collection;

class StoryService
{
    private const STORY_LIFETIME_HOURS = 24;

    public function __construct(
        private SupabaseService $supabaseService
    ) {
    }

    /**
     * Create a new story.
     */
    public function createStory(User $user, \Illuminate\Http\UploadedFile $media, ?string $caption = null): Story
    {
        $mediaUrl = $this->supabaseService->uploadFile($media, 'stories');
        if (!$mediaUrl) {
            throw new \Exception('Failed to upload story media. Ensure Supabase is configured correctly.');
        }

        $mimeType = $media->getMimeType();
        $mediaType = str_starts_with($mimeType ?? '', 'image/') ? 'image' : 'video';

        return $user->stories()->create([
            'media_url' => $mediaUrl,
            'media_type' => $mediaType,
            'caption' => $caption,
            'expires_at' => now()->addHours(self::STORY_LIFETIME_HOURS),
        ]);
    }

    /**
     * Get stories for feed (grouped by user, only non-expired).
     * Returns users who have active stories, with their stories ordered by created_at.
     */
    public function getStoriesForFeed(User $user): array
    {
        $followingIds = $user->following()->pluck('following_id')->toArray();
        $followingIds[] = $user->id; // Include own stories

        $blockedIds = array_merge($user->blockedUserIds(), $user->blockedByUserIds());

        $stories = Story::active()
            ->with('user')
            ->whereIn('user_id', $followingIds)
            ->whereNotIn('user_id', $blockedIds)
            ->orderBy('created_at', 'asc')
            ->get();

        // Group by user_id
        $grouped = $stories->groupBy('user_id')->map(function (Collection $userStories, $userId) use ($user) {
            $storyUser = $userStories->first()->user;
            return [
                'user' => [
                    'id' => $storyUser->id,
                    'name' => $storyUser->name,
                    'username' => $storyUser->username,
                    'profile_picture' => $storyUser->profile_picture,
                ],
                'stories' => $userStories->values()->map(fn ($s) => [
                    'id' => $s->id,
                    'media_url' => $s->media_url,
                    'media_type' => $s->media_type,
                    'caption' => $s->caption,
                    'expires_at' => $s->expires_at->toIso8601String(),
                    'created_at' => $s->created_at->toIso8601String(),
                ])->toArray(),
                'has_unviewed' => $userId == $user->id ? false : true, // Could be enhanced with story_views table
            ];
        })->values()->toArray();

        return $grouped;
    }
}
