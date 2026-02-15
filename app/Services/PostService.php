<?php

namespace App\Services;

use App\Models\Post;
use App\Models\User;
use App\Notifications\ShareNotification;
use App\Services\SupabaseService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class PostService
{
    public function __construct(
        private HashtagService $hashtagService,
        private SupabaseService $supabaseService,
        private MentionService $mentionService
    ) {
    }

    /**
     * Get feed posts for a user (posts from followed users).
     */
    public function getFeed(User $user, int $perPage = 15): LengthAwarePaginator
    {
        $followingIds = $user->following()->pluck('following_id')->toArray();
        $followingIds[] = $user->id; // Include user's own posts

        $blockedIds = array_merge($user->blockedUserIds(), $user->blockedByUserIds());

        return Post::with(['user', 'hashtags', 'likes', 'sharedPost.user', 'poll.options'])
            ->whereIn('user_id', $followingIds)
            ->whereNotIn('user_id', $blockedIds)
            ->where('is_archived', false)
            ->where(function ($query) use ($user) {
                $query->where('visibility', 'public')
                    ->orWhere('visibility', 'followers')
                    ->orWhere(function ($q) use ($user) {
                        $q->where('visibility', 'private')
                            ->where('user_id', $user->id);
                    });
            })
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Get suggested posts (from non-followed users with high engagement).
     */
    public function getSuggestedPosts(User $user, int $limit = 5): Collection
    {
        $followingIds = $user->following()->pluck('following_id')->toArray();
        $followingIds[] = $user->id;

        $blockedIds = array_merge($user->blockedUserIds(), $user->blockedByUserIds());

        $posts = Post::with(['user', 'hashtags', 'likes', 'sharedPost.user', 'poll.options'])
            ->whereNotIn('user_id', $followingIds)
            ->whereNotIn('user_id', $blockedIds)
            ->where('is_archived', false)
            ->where('visibility', 'public')
            ->withCount(['likes', 'allComments'])
            ->orderBy('created_at', 'desc')
            ->limit($limit * 3) // Get more, then sort by engagement
            ->get();

        return $posts->sortByDesc(fn ($p) => ($p->likes_count ?? 0) + ($p->all_comments_count ?? 0))->take($limit)->values();
    }

    /**
     * Get posts by a specific user.
     */
    public function getUserPosts(User $user, ?User $viewer = null, int $perPage = 15): LengthAwarePaginator
    {
        // If viewer exists and there's a block relationship, return empty
        if ($viewer && $viewer->id !== $user->id) {
            if ($viewer->hasBlocked($user) || $user->hasBlocked($viewer)) {
                return Post::whereRaw('1 = 0')->paginate($perPage);
            }
        }

        $query = Post::with(['user', 'hashtags', 'likes', 'poll.options'])
            ->where('user_id', $user->id)
            ->where('is_archived', false);

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
        $mediaUrl = null;
        $mediaType = null;

            // Handle file upload if media is provided
        if (isset($data['media']) && $data['media']) {
            $mediaUrl = $this->supabaseService->uploadFile($data['media'], 'posts');
            if (!$mediaUrl) {
                // Upload failed - throw exception if this was the only content
                $content = trim($data['content'] ?? '');
                if (empty($content)) {
                    // Get more details from SupabaseService logs
                    \Log::error('Media upload failed - no content provided', [
                        'user_id' => $user->id,
                        'file_name' => $data['media']->getClientOriginalName(),
                        'file_size' => $data['media']->getSize(),
                        'mime_type' => $data['media']->getMimeType(),
                    ]);
                    throw new \Exception('Failed to upload media file. Check Laravel logs for details. Ensure SUPABASE_SERVICE_ROLE_KEY is set and bucket "publicConnectly" exists in Supabase.');
                }
                // If content exists, continue without media (media upload failed but we have content)
                \Log::warning('Media upload failed but post will be created with content only', [
                    'user_id' => $user->id,
                    'file_name' => $data['media']->getClientOriginalName(),
                ]);
            } else {
                $mimeType = $data['media']->getMimeType();
                $mediaType = str_starts_with($mimeType, 'image/') ? 'image' : 'video';
            }
        }

        $post = $user->posts()->create([
            'content' => $data['content'] ?? '',
            'media_url' => $mediaUrl,
            'media_type' => $mediaType,
            'visibility' => $data['visibility'] ?? 'public',
            'shared_post_id' => $data['shared_post_id'] ?? null,
        ]);

        // When sharing a post, increment the original post's shares_count and notify owner
        if (!empty($post->shared_post_id)) {
            $originalPost = Post::with('user')->find($post->shared_post_id);
            if ($originalPost) {
                $originalPost->increment('shares_count');
                if ($originalPost->user_id !== $user->id) {
                    $originalPost->user->notify(new ShareNotification($originalPost->fresh(), $user));
                }
            }
        }

        // Sync hashtags (only if content exists)
        if (!empty($data['content'])) {
            $this->hashtagService->syncHashtags($post, $data['content']);
            // Notify mentioned users in post
            $this->mentionService->notifyMentionedUsers($data['content'], $post, $user, 'post');
        }

        // Create poll if provided
        if (!empty($data['poll']['question']) && !empty($data['poll']['options'])) {
            $poll = $post->poll()->create(['question' => $data['poll']['question']]);
            foreach (array_values($data['poll']['options']) as $order => $text) {
                if (trim((string) $text) !== '') {
                    $poll->options()->create(['text' => trim($text), 'order' => $order]);
                }
            }
        }

        return $post->load(['user', 'hashtags', 'sharedPost.user', 'poll.options']);
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
