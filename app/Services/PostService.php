<?php

namespace App\Services;

use App\Models\Post;
use App\Models\User;
use App\Notifications\ShareNotification;
use App\Services\SupabaseService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PostService
{
    public function __construct(
        private HashtagService $hashtagService,
        private SupabaseService $supabaseService,
        private MentionService $mentionService,
        private VideoTranscodeService $videoTranscodeService
    ) {
    }

    /**
     * Get feed posts for a user (posts from followed users).
     *
     * @param string $sort 'for_you' (engagement-scored) or 'recent' (chronological)
     */
    public function getFeed(User $user, int $perPage = 15, string $sort = 'for_you'): LengthAwarePaginator
    {
        $followingIds = $user->following()->pluck('following_id')->toArray();
        $followingIds[] = $user->id; // Include user's own posts

        $blockedIds = array_merge($user->blockedUserIds(), $user->blockedByUserIds());

        $query = Post::with(['user', 'hashtags', 'likes', 'sharedPost.user', 'poll.options'])
            ->whereIn('user_id', $followingIds)
            ->whereNotIn('user_id', $blockedIds)
            ->where('is_archived', false)
            ->where(function ($q) use ($user) {
                $q->where('visibility', 'public')
                    ->orWhere('visibility', 'followers')
                    ->orWhere(function ($q2) use ($user) {
                        $q2->where('visibility', 'private')
                            ->where('user_id', $user->id);
                    });
            });

        if ($sort === 'for_you') {
            // Score = (likes × 3) + (comments × 2) + recency boost + friend bonus
            $query->selectRaw('posts.*,
                (COALESCE((SELECT COUNT(*) FROM likes WHERE likeable_type = ? AND likeable_id = posts.id), 0) * 3 +
                 COALESCE((SELECT COUNT(*) FROM comments WHERE post_id = posts.id), 0) * 2 +
                 CASE WHEN posts.created_at >= NOW() - INTERVAL 6 HOUR THEN 10
                      WHEN posts.created_at >= NOW() - INTERVAL 24 HOUR THEN 5
                      ELSE 0 END +
                 CASE WHEN EXISTS (
                     SELECT 1 FROM friend_requests
                     WHERE status = ? AND (
                         (sender_id = ? AND receiver_id = posts.user_id) OR
                         (receiver_id = ? AND sender_id = posts.user_id)
                     )
                 ) THEN 5 ELSE 0 END) AS feed_score',
                ['App\\Models\\Post', 'accepted', $user->id, $user->id])
                ->orderByDesc('feed_score')
                ->orderByDesc('posts.created_at');
        } else {
            $query->orderByDesc('created_at');
        }

        return $query->paginate($perPage);
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

        // Handle file upload if media is provided (Supabase); post still created without media if upload fails
        if (isset($data['media']) && $data['media']) {
            $file = $data['media'];
            $content = trim($data['content'] ?? '');
            $mimeType = $file->getMimeType();
            $isVideo = str_starts_with($mimeType, 'video/');

            // Transcode video to H.264/AAC MP4 for cross-browser playback
            $transcodedPath = null;
            if ($isVideo && $this->videoTranscodeService->isAvailable()) {
                $transcodedPath = $this->videoTranscodeService->transcode($file->getRealPath());
                if (!$transcodedPath) {
                    \Log::warning('Video transcoding failed; uploading original file.', ['user_id' => $user->id]);
                }
            }

            // Uploads can be flaky (network/Supabase). Retry a few times before giving up.
            $uploadAttempts = 3;
            $lastError = null;
            for ($attempt = 1; $attempt <= $uploadAttempts; $attempt++) {
                try {
                    if ($transcodedPath) {
                        $mediaUrl = $this->supabaseService->uploadFromPath($transcodedPath, 'video/mp4', 'posts');
                    } else {
                        $mediaUrl = $this->supabaseService->uploadFile($file, 'posts');
                    }
                    if ($mediaUrl) {
                        $mediaType = $isVideo ? 'video' : 'image';
                    }
                    break;
                } catch (\Throwable $e) {
                    $lastError = $e;
                    if ($attempt < $uploadAttempts) {
                        // Small backoff before retry
                        usleep(300000 * $attempt);
                    }
                }
            }

            // Clean up transcoded temp file regardless of upload success
            if ($transcodedPath && is_file($transcodedPath)) {
                @unlink($transcodedPath);
            }

            if (! $mediaUrl) {
                \Log::warning('Post media upload failed after retries; creating post without media.', [
                    'user_id' => $user->id,
                    'file_name' => $file->getClientOriginalName(),
                    'error' => $lastError?->getMessage(),
                ]);

                // If user posted a media-only post (no caption), don't silently create an empty card.
                if (empty($content)) {
                    throw ValidationException::withMessages([
                        'media' => ['Media upload failed (connection timeout to Supabase). Please try again.'],
                    ]);
                }
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
