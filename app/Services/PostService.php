<?php

namespace App\Services;

use App\Models\Post;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class PostService
{
    public function __construct(
        private HashtagService $hashtagService
    ) {
    }

    /**
     * Get feed posts for a user (posts from followed users).
     */
    public function getFeed(User $user, int $perPage = 15): LengthAwarePaginator
    {
        $followingIds = $user->following()->pluck('following_id')->toArray();
        $followingIds[] = $user->id; // Include user's own posts

        return Post::with(['user', 'hashtags', 'likes'])
            ->whereIn('user_id', $followingIds)
            ->where(function ($query) use ($user, $followingIds) {
                $query->where('visibility', 'public')
                    ->orWhere(function ($q) use ($user, $followingIds) {
                        $q->where('visibility', 'followers')
                            ->whereIn('user_id', $followingIds);
                    });
            })
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Get posts by a specific user.
     */
    public function getUserPosts(User $user, ?User $viewer = null, int $perPage = 15): LengthAwarePaginator
    {
        $query = Post::with(['user', 'hashtags', 'likes'])
            ->where('user_id', $user->id);

        // If viewer is not the owner and profile is private, check if viewer follows
        if ($viewer && $viewer->id !== $user->id && $user->privacy_settings === 'private') {
            if (!$viewer->isFollowing($user)) {
                return Post::whereRaw('1 = 0')->paginate($perPage); // Return empty paginator
            }
        }

        // Filter by visibility
        if ($viewer && $viewer->id !== $user->id) {
            $query->where(function ($q) use ($user, $viewer) {
                $q->where('visibility', 'public')
                    ->orWhere(function ($subQ) use ($user, $viewer) {
                        $subQ->where('visibility', 'followers')
                            ->whereExists(function ($existsQuery) use ($user, $viewer) {
                                $existsQuery->select(DB::raw(1))
                                    ->from('follows')
                                    ->whereColumn('follows.following_id', 'posts.user_id')
                                    ->where('follows.follower_id', $viewer->id);
                            });
                    });
            });
        }

        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    /**
     * Create a new post.
     */
    public function createPost(User $user, array $data): Post
    {
        $post = $user->posts()->create([
            'content' => $data['content'],
            'media_url' => $data['media_url'] ?? null,
            'media_type' => $data['media_type'] ?? null,
            'visibility' => $data['visibility'] ?? 'public',
        ]);

        // Sync hashtags
        $this->hashtagService->syncHashtags($post, $data['content']);

        return $post->load(['user', 'hashtags']);
    }

    /**
     * Update a post.
     */
    public function updatePost(Post $post, array $data): Post
    {
        $post->update([
            'content' => $data['content'] ?? $post->content,
            'media_url' => $data['media_url'] ?? $post->media_url,
            'media_type' => $data['media_type'] ?? $post->media_type,
            'visibility' => $data['visibility'] ?? $post->visibility,
        ]);

        // Sync hashtags if content changed
        if (isset($data['content'])) {
            $this->hashtagService->syncHashtags($post, $data['content']);
        }

        return $post->load(['user', 'hashtags']);
    }
}
