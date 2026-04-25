<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\UpdateProfileRequest;
use App\Http\Requests\User\UploadProfilePictureRequest;
use App\Http\Resources\CommunityResource;
use App\Http\Resources\PostResource;
use App\Http\Resources\UserResource;
use App\Models\Like;
use App\Models\Post;
use App\Models\User;
use App\Services\MediaService;
use App\Services\SupabaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class UserController extends Controller
{
    public function __construct(
        private MediaService $mediaService
    ) {
    }

    /**
     * Stream user cover image (proxies Supabase URLs to avoid 403 when bucket is not public).
     */
    public function coverImage(Request $request, User $user): Response|JsonResponse|RedirectResponse
    {
        $currentUser = $request->user();
        if ($currentUser && $currentUser->id !== $user->id) {
            if ($currentUser->hasBlocked($user) || $user->hasBlocked($currentUser)) {
                return response()->json(['message' => 'User not found'], 404);
            }
            $visibility = $user->cover_image_visibility ?? 'public';
            if ($visibility === 'friends' && !$user->isFriendWith($currentUser)) {
                return response()->json(['message' => 'User not found'], 404);
            }
        }

        $coverUrl = $user->cover_image;
        if (empty($coverUrl)) {
            return response()->json(['message' => 'No cover image'], 404);
        }

        $isSupabaseUrl = str_contains($coverUrl, 'supabase.co');

        if ($isSupabaseUrl) {
            if (config('services.supabase.image_redirect_only')) {
                return redirect()->away($coverUrl, 302);
            }
            $supabase = app(SupabaseService::class);
            $response = $supabase->fetchFileWithFallback($coverUrl);
            if ($response) {
                $contentType = $response->header('Content-Type') ?: 'image/jpeg';
                return response($response->body(), 200, [
                    'Content-Type' => $contentType,
                    'Cache-Control' => 'public, max-age=86400',
                ]);
            }
            // Server-side fetch failed (common in Docker if PHP cannot reach Supabase). Browsers often can load the public URL.
            if (filter_var($coverUrl, FILTER_VALIDATE_URL)) {
                Log::warning('Cover image: proxy failed, redirecting browser to Supabase URL', ['user_id' => $user->id]);
                return redirect()->away($coverUrl, 302);
            }
            Log::warning('Cover image proxy fetch failed', [
                'user_id' => $user->id,
                'stored_url' => $coverUrl,
            ]);
            return response()->json(['message' => 'Failed to load cover image'], 502);
        }

        // Local storage: redirect to the asset URL
        return redirect()->away(
            filter_var($coverUrl, FILTER_VALIDATE_URL) ? $coverUrl : asset('storage/' . $coverUrl)
        );
    }

    /**
     * Stream user profile picture (proxies Supabase URLs to avoid 403).
     */
    public function profilePicture(Request $request, User $user): Response|JsonResponse|RedirectResponse
    {
        $currentUser = $request->user();
        if ($currentUser && $currentUser->id !== $user->id) {
            if ($currentUser->hasBlocked($user) || $user->hasBlocked($currentUser)) {
                return response()->json(['message' => 'User not found'], 404);
            }
            $visibility = $user->profile_picture_visibility ?? 'public';
            if ($visibility === 'friends' && !$user->isFriendWith($currentUser)) {
                return response()->json(['message' => 'User not found'], 404);
            }
        }

        $pictureUrl = $user->profile_picture;
        if (empty($pictureUrl)) {
            return response()->json(['message' => 'No profile picture'], 404);
        }

        $isSupabaseUrl = str_contains($pictureUrl, 'supabase.co');

        if ($isSupabaseUrl) {
            if (config('services.supabase.image_redirect_only')) {
                return redirect()->away($pictureUrl, 302);
            }
            $supabase = app(SupabaseService::class);
            $response = $supabase->fetchFileWithFallback($pictureUrl);
            if ($response) {
                $contentType = $response->header('Content-Type') ?: 'image/jpeg';
                return response($response->body(), 200, [
                    'Content-Type' => $contentType,
                    'Cache-Control' => 'public, max-age=86400',
                ]);
            }
            if (filter_var($pictureUrl, FILTER_VALIDATE_URL)) {
                Log::warning('Profile picture: proxy failed, redirecting browser to Supabase URL', ['user_id' => $user->id]);
                return redirect()->away($pictureUrl, 302);
            }
            Log::warning('Profile picture proxy fetch failed', [
                'user_id' => $user->id,
                'stored_url' => $pictureUrl,
            ]);
            return response()->json(['message' => 'Failed to load profile picture'], 502);
        }

        return redirect()->away(
            filter_var($pictureUrl, FILTER_VALIDATE_URL) ? $pictureUrl : asset('storage/' . $pictureUrl)
        );
    }

    /**
     * Get user profile.
     *
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     */
    public function profile(Request $request, User $user): JsonResponse
    {
        $currentUser = $request->user();

        // Hide profile if blocked either way
        if ($currentUser && $currentUser->id !== $user->id) {
            if ($currentUser->hasBlocked($user) || $user->hasBlocked($currentUser)) {
                return response()->json([
                    'message' => 'User not found',
                ], 404);
            }
        }

        try {
            $user->loadCount(['followers', 'following', 'posts']);
            $user->load(['latestProfilePicturePost.user', 'latestCoverImagePost.user']);
            // Attach recent likers and is_liked for latest profile/cover posts (for MediaView)
            foreach (['latestProfilePicturePost', 'latestCoverImagePost'] as $rel) {
                $post = $user->$rel;
                if ($post) {
                    $post->recent_likers = $post->likes()->with('user')->orderBy('created_at', 'desc')->take(3)->get()->pluck('user')->filter()->values();
                    $post->is_liked = $currentUser ? $post->isLikedBy($currentUser) : false;
                }
            }
            $imageBase = config('services.supabase.cover_proxy_base')
                ?: $request->getSchemeAndHttpHost()
                ?: rtrim(config('app.url'), '/');
            $imageBase = rtrim($imageBase, '/');
            $followersPreview = $user->followers()
                ->limit(9)
                ->get(['id', 'name', 'username', 'profile_picture'])
                ->map(function ($u) use ($imageBase) {
                    $pic = $u->profile_picture;
                    if (empty($pic)) {
                        return ['id' => $u->id, 'name' => $u->name, 'username' => $u->username, 'profile_picture' => null];
                    }
                    if (str_contains($pic, 'supabase.co')) {
                        $pic = "{$imageBase}/api/users/{$u->username}/profile-picture";
                    } elseif (!filter_var($pic, FILTER_VALIDATE_URL)) {
                        $pic = asset('storage/' . $pic);
                    }
                    return ['id' => $u->id, 'name' => $u->name, 'username' => $u->username, 'profile_picture' => $pic];
                });
        } catch (\Throwable $e) {
            Log::warning('Profile followers_preview failed', ['user_id' => $user->id, 'error' => $e->getMessage()]);
            $followersPreview = collect();
        }

        return response()->json([
            'user' => new UserResource($user),
            'followers_preview' => $followersPreview,
        ]);
    }

    /**
     * Get followers, following, and mutual connections for the authenticated user.
     */
    public function connections(Request $request): JsonResponse
    {
        $user = $request->user();

        // Exclude blocked relationships from connection lists
        $blockedIds = array_merge($user->blockedUserIds(), $user->blockedByUserIds());

        $followersQuery = $user->followers()->withCount(['followers', 'following']);
        $followingQuery = $user->following()->withCount(['followers', 'following']);

        if (!empty($blockedIds)) {
            $followersQuery->whereNotIn('users.id', $blockedIds);
            $followingQuery->whereNotIn('users.id', $blockedIds);
        }

        $followers = $followersQuery->get();
        $following = $followingQuery->get();

        $followerIds = $followers->pluck('id')->toArray();
        $followingIds = $following->pluck('id')->toArray();
        $mutualIds = array_values(array_intersect($followerIds, $followingIds));

        $mutuals = $followers->whereIn('id', $mutualIds)->values();

        return response()->json([
            'followers' => UserResource::collection($followers),
            'following' => UserResource::collection($following),
            'mutuals' => UserResource::collection($mutuals),
        ]);
    }

    /**
     * Get user posts.
     *
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     */
    public function posts(Request $request, User $user): JsonResponse
    {
        try {
            $currentUser = $request->user();
            if ($currentUser && $currentUser->id !== $user->id) {
                if ($currentUser->hasBlocked($user) || $user->hasBlocked($currentUser)) {
                    return response()->json([
                        'message' => 'User not found',
                        'posts' => [],
                        'pagination' => ['current_page' => 1, 'last_page' => 1, 'per_page' => 15, 'total' => 0],
                    ], 404);
                }
            }

            $posts = $user->posts()
                ->with(['user', 'hashtags', 'likes', 'sharedPost.user'])
                ->withCount(['likes', 'allComments as comments_count'])
                ->latest()
                ->paginate(15);

            // Check if current user liked/bookmarked each post
            if ($request->user()) {
                $likedPostIds = $request->user()
                    ->likes()
                    ->where('likeable_type', Post::class)
                    ->whereIn('likeable_id', $posts->pluck('id'))
                    ->pluck('likeable_id')
                    ->toArray();
                $bookmarkedIds = $request->user()
                    ->bookmarkedPosts()
                    ->whereIn('posts.id', $posts->pluck('id'))
                    ->pluck('posts.id')
                    ->toArray();

                $posts->getCollection()->transform(function ($post) use ($likedPostIds, $bookmarkedIds) {
                    $post->is_liked = in_array($post->id, $likedPostIds);
                    $post->is_bookmarked = in_array($post->id, $bookmarkedIds);
                    return $post;
                });
            }

            // Load recent likers (3 per post) in bulk
            $postIds = $posts->pluck('id')->toArray();
            $recentLikes = Like::where('likeable_type', Post::class)
                ->whereIn('likeable_id', $postIds)
                ->with('user')
                ->orderBy('created_at', 'desc')
                ->get();

            $recentLikersByPost = [];
            foreach ($recentLikes->groupBy('likeable_id') as $pid => $likes) {
                $recentLikersByPost[$pid] = $likes->take(3)->pluck('user')->filter()->values();
            }

            $posts->getCollection()->each(function ($post) use ($recentLikersByPost) {
                $post->recent_likers = $recentLikersByPost[$post->id] ?? collect();
            });

            return response()->json([
                'posts' => PostResource::collection($posts->items()),
                'pagination' => [
                    'current_page' => $posts->currentPage(),
                    'last_page' => $posts->lastPage(),
                    'per_page' => $posts->perPage(),
                    'total' => $posts->total(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('User posts fetch failed: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'user_id' => $user->id,
            ]);

            return response()->json([
                'message' => 'Failed to fetch user posts',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred',
            ], 500);
        }
    }

    /**
     * Get communities the user is a member of (for profile tab).
     *
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     */
    public function communities(Request $request, User $user): JsonResponse
    {
        $communities = $user->communities()
            ->with(['creator'])
            ->withCount('members')
            ->orderByPivot('joined_at', 'desc')
            ->get();

        $currentUser = $request->user();
        $communities->each(function ($community) use ($currentUser) {
            $community->is_member = true;
            $community->is_moderator = $currentUser ? $community->isModerator($currentUser) : false;
        });

        return response()->json([
            'communities' => CommunityResource::collection($communities),
        ]);
    }

    /**
     * Update authenticated user's profile.
     *
     * @param UpdateProfileRequest $request
     * @return JsonResponse
     */
    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();
        $supabaseService = app(\App\Services\SupabaseService::class);
        $imageUploadFailed = false;

        // Handle profile picture upload (archive in profile-pictures-storage + current in profile-picture)
        if ($request->hasFile('profile_picture')) {
            try {
                $file = $request->file('profile_picture');

                // Archive copy – best-effort, per-user folder for media tab history
                try {
                    $supabaseService->uploadFile($file, 'profile-pictures/profile-pictures-storage/' . $user->id);
                } catch (\Throwable $e) {
                    Log::warning('Profile picture archive upload failed', ['error' => $e->getMessage(), 'user_id' => $user->id]);
                }

                // Current profile picture (single latest) – stored under profile-pictures/profile-picture
                $currentProfileUrl = $supabaseService->uploadFile($file, 'profile-pictures/profile-picture');
                if ($currentProfileUrl) {
                    if ($user->profile_picture) {
                        $supabaseService->deleteFile($user->profile_picture);
                    }
                    $data['profile_picture'] = $currentProfileUrl;
                } else {
                    $imageUploadFailed = true;
                }
            } catch (\Throwable $e) {
                Log::warning('Profile picture upload failed', ['error' => $e->getMessage()]);
                $imageUploadFailed = true;
            }
        }

        // Handle cover image upload (archive in cover-images-storage + current in cover-image)
        if ($request->hasFile('cover_image')) {
            try {
                $file = $request->file('cover_image');

                // Archive copy – best-effort, per-user folder for media tab history
                try {
                    $supabaseService->uploadFile($file, 'cover-images/cover-images-storage/' . $user->id);
                } catch (\Throwable $e) {
                    Log::warning('Cover image archive upload failed', ['error' => $e->getMessage(), 'user_id' => $user->id]);
                }

                // Current cover image (single latest) – stored under cover-images/cover-image
                $currentCoverUrl = $supabaseService->uploadFile($file, 'cover-images/cover-image');
                if ($currentCoverUrl) {
                    if ($user->cover_image) {
                        $supabaseService->deleteFile($user->cover_image);
                    }
                    $data['cover_image'] = $currentCoverUrl;
                } else {
                    Log::warning('Cover image upload returned null', ['user_id' => $user->id]);
                    $imageUploadFailed = true;
                }
            } catch (\Throwable $e) {
                Log::warning('Cover image upload failed', ['error' => $e->getMessage(), 'user_id' => $user->id]);
                $imageUploadFailed = true;
            }
        }

        // Remove file objects from $data so only URLs and captions are saved
        foreach (['profile_picture', 'cover_image'] as $key) {
            if (isset($data[$key]) && $data[$key] instanceof \Illuminate\Http\UploadedFile) {
                unset($data[$key]);
            }
        }
        $user->update($data);

        // Create a feed post when profile picture or cover image is updated (so it appears in home feed with like/comment)
        if (!empty($data['profile_picture'])) {
            $post = $user->posts()->create([
                'content' => $data['profile_picture_caption'] ?? '',
                'media_url' => $data['profile_picture'],
                'media_type' => 'image',
                'visibility' => $user->profile_picture_visibility === 'friends' ? 'followers' : 'public',
                'post_type' => 'profile_picture_update',
            ]);
            $user->update(['latest_profile_picture_post_id' => $post->id]);
        }
        if (!empty($data['cover_image'])) {
            $post = $user->posts()->create([
                'content' => $data['cover_image_caption'] ?? '',
                'media_url' => $data['cover_image'],
                'media_type' => 'image',
                'visibility' => $user->cover_image_visibility === 'friends' ? 'followers' : 'public',
                'post_type' => 'cover_image_update',
            ]);
            $user->update(['latest_cover_image_post_id' => $post->id]);
        }

        if (config('app.debug')) {
            Log::debug('Profile update result', [
                'user_id' => $user->id,
                'cover_in_data' => $data['cover_image'] ?? null,
                'image_upload_failed' => $imageUploadFailed,
                'cover_after_update' => $user->fresh()->cover_image,
            ]);
        }

        $message = 'Profile updated successfully';
        if ($imageUploadFailed) {
            $message .= '. Image upload failed — please try again or use a smaller image.';
        }

        return response()->json([
            'message' => $message,
            'user' => new UserResource($user->fresh()),
            'image_upload_failed' => $imageUploadFailed,
        ]);
    }

    /**
     * Upload profile picture.
     *
     * @param UploadProfilePictureRequest $request
     * @return JsonResponse
     */
    public function uploadProfilePicture(UploadProfilePictureRequest $request): JsonResponse
    {
        $user = $request->user();
        $supabaseService = app(\App\Services\SupabaseService::class);

        $file = $request->file('profile_picture');

        // Archive copy – best-effort, per-user folder for media tab history
        try {
            $supabaseService->uploadFile($file, 'profile-pictures/profile-pictures-storage/' . $user->id);
        } catch (\Throwable $e) {
            Log::warning('Profile picture archive upload failed (uploadProfilePicture)', ['error' => $e->getMessage(), 'user_id' => $user->id]);
        }

        // Upload new current profile picture
        $currentProfileUrl = $supabaseService->uploadFile($file, 'profile-pictures/profile-picture');
        
        if (!$currentProfileUrl) {
            return response()->json([
                'message' => 'Failed to upload profile picture',
            ], 500);
        }

        // Delete old current profile picture if exists (archives remain untouched)
        if ($user->profile_picture) {
            $supabaseService->deleteFile($user->profile_picture);
        }

        $user->update(['profile_picture' => $currentProfileUrl]);

        return response()->json([
            'message' => 'Profile picture uploaded successfully',
            'user' => new UserResource($user->fresh()),
        ]);
    }

    /**
     * List current user's profile picture history (from profile-pictures-storage).
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function profilePictureHistory(Request $request): JsonResponse
    {
        $user = $request->user();
        $supabase = app(SupabaseService::class);
        $prefix = 'profile-pictures/profile-pictures-storage/' . $user->id;
        $paths = $supabase->listObjects($prefix);
        $base = rtrim(config('services.supabase.cover_proxy_base') ?: $request->getSchemeAndHttpHost() ?: config('app.url'), '/');
        $items = array_map(function ($path) use ($base) {
            return ['url' => $base . '/api/user/storage-image?path=' . rawurlencode($path)];
        }, $paths);
        return response()->json(['items' => array_values($items)]);
    }

    /**
     * List current user's cover image history (from cover-images-storage).
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function coverImageHistory(Request $request): JsonResponse
    {
        $user = $request->user();
        $supabase = app(SupabaseService::class);
        $prefix = 'cover-images/cover-images-storage/' . $user->id;
        $paths = $supabase->listObjects($prefix);
        $base = rtrim(config('services.supabase.cover_proxy_base') ?: $request->getSchemeAndHttpHost() ?: config('app.url'), '/');
        $items = array_map(function ($path) use ($base) {
            return ['url' => $base . '/api/user/storage-image?path=' . rawurlencode($path)];
        }, $paths);
        return response()->json(['items' => array_values($items)]);
    }

    /**
     * Serve a storage image (profile-pictures-storage or cover-images-storage) for the current user only.
     *
     * @param Request $request
     * @return Response|JsonResponse
     */
    public function storageImage(Request $request): Response|JsonResponse
    {
        $path = $request->query('path');
        if (!is_string($path) || $path === '') {
            return response()->json(['message' => 'Missing path'], 400);
        }
        $path = trim($path, '/');
        $user = $request->user();
        $allowedPrefix1 = 'profile-pictures/profile-pictures-storage/' . $user->id . '/';
        $allowedPrefix2 = 'cover-images/cover-images-storage/' . $user->id . '/';
        if (!str_starts_with($path, $allowedPrefix1) && !str_starts_with($path, $allowedPrefix2)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $supabase = app(SupabaseService::class);
        $publicUrl = $supabase->getPublicUrl($path);
        $response = $supabase->fetchFile($publicUrl);
        if (!$response) {
            return response()->json(['message' => 'Failed to load image'], 502);
        }
        $contentType = $response->header('Content-Type') ?: 'image/jpeg';
        return response($response->body(), 200, [
            'Content-Type' => $contentType,
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }

    /**
     * Get suggested users (users not followed by current user).
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function suggested(Request $request): JsonResponse
    {
        $user = $request->user();

        // Get IDs of users the current user is following
        $followingIds = $user->following()->pluck('following_id')->toArray();
        $followingIds[] = $user->id; // Exclude current user

        // Exclude blocked users
        $blockedIds = array_merge($user->blockedUserIds(), $user->blockedByUserIds());

        // Get users not in the following list and not blocked
        $suggestedUsers = User::whereNotIn('id', $followingIds)
            ->when(!empty($blockedIds), fn ($q) => $q->whereNotIn('id', $blockedIds))
            ->withCount(['followers', 'following'])
            ->limit(10)
            ->get();

        return response()->json([
            'users' => UserResource::collection($suggestedUsers),
        ]);
    }

    /**
     * Get notification preferences for the authenticated user.
     */
    public function notificationPreferences(Request $request): JsonResponse
    {
        $user = $request->user();
        $prefs = $user->notification_preferences ?? User::defaultNotificationPreferences();

        return response()->json([
            'notification_preferences' => array_merge(User::defaultNotificationPreferences(), $prefs),
            'muted_topics' => $user->muted_topics ?? [],
            'muted_users' => $user->muted_users ?? [],
            'muted_communities' => $user->muted_communities ?? [],
        ]);
    }

    /**
     * Update notification preferences for the authenticated user.
     */
    public function updateNotificationPreferences(Request $request): JsonResponse
    {
        $request->validate([
            'notification_preferences' => 'array',
            'notification_preferences.likes' => 'boolean',
            'notification_preferences.comments' => 'boolean',
            'notification_preferences.follows' => 'boolean',
            'notification_preferences.mentions' => 'boolean',
            'notification_preferences.messages' => 'boolean',
            'muted_topics' => 'array',
            'muted_topics.*' => 'string',
            'muted_users' => 'array',
            'muted_users.*' => 'integer',
            'muted_communities' => 'array',
            'muted_communities.*' => 'integer',
        ]);

        $user = $request->user();
        $prefs = $user->notification_preferences ?? User::defaultNotificationPreferences();
        $updated = array_merge($prefs, $request->input('notification_preferences', []));
        $user->update([
            'notification_preferences' => $updated,
            'muted_topics' => $request->input('muted_topics', $user->muted_topics ?? []),
            'muted_users' => $request->input('muted_users', $user->muted_users ?? []),
            'muted_communities' => $request->input('muted_communities', $user->muted_communities ?? []),
        ]);

        return response()->json([
            'message' => 'Notification preferences updated',
            'notification_preferences' => $user->fresh()->notification_preferences,
            'muted_topics' => $user->fresh()->muted_topics ?? [],
            'muted_users' => $user->fresh()->muted_users ?? [],
            'muted_communities' => $user->fresh()->muted_communities ?? [],
        ]);
    }

    /**
     * Export user data (GDPR/CCPA).
     */
    public function exportData(Request $request): JsonResponse
    {
        $user = $request->user()->load([
            'posts', 'comments', 'likes', 'followers', 'following',
            'communities', 'bookmarkedPosts',
        ]);

        $data = [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'username' => $user->username,
                'bio' => $user->bio,
                'location' => $user->location,
                'website' => $user->website,
                'created_at' => $user->created_at?->toIso8601String(),
            ],
            'posts_count' => $user->posts->count(),
            'posts' => $user->posts->map(fn ($p) => [
                'id' => $p->id,
                'content' => $p->content,
                'created_at' => $p->created_at?->toIso8601String(),
            ])->toArray(),
            'followers_count' => $user->followers->count(),
            'following_count' => $user->following->count(),
        ];

        return response()->json(['data' => $data]);
    }

    /**
     * Delete user account (GDPR/CCPA).
     */
    /**
     * Mark the authenticated user's onboarding as complete.
     */
    public function completeOnboarding(Request $request): JsonResponse
    {
        $request->user()->update(['onboarding_completed' => true]);

        return response()->json(['message' => 'Onboarding complete']);
    }

    public function heartbeat(Request $request): JsonResponse
    {
        $request->user()->update(['last_seen_at' => now()]);

        return response()->json(['ok' => true]);
    }

    public function deleteAccount(Request $request): JsonResponse
    {
        $request->validate([
            'password' => 'required|string',
            'confirmation' => 'required|in:DELETE',
        ]);

        $user = $request->user();

        if (!\Illuminate\Support\Facades\Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid password'], 422);
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'Account deleted']);
    }
}
