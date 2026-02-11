<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\UpdateProfileRequest;
use App\Http\Requests\User\UploadProfilePictureRequest;
use App\Http\Resources\PostResource;
use App\Http\Resources\UserResource;
use App\Models\Like;
use App\Models\Post;
use App\Models\User;
use App\Services\MediaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class UserController extends Controller
{
    public function __construct(
        private MediaService $mediaService
    ) {
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

        $user->loadCount(['followers', 'following', 'posts']);

        return response()->json([
            'user' => new UserResource($user),
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
        
        // Handle profile picture upload
        if ($request->hasFile('profile_picture')) {
            // Delete old profile picture if exists
            if ($user->profile_picture) {
                $supabaseService->deleteFile($user->profile_picture);
            }
            $profilePictureUrl = $supabaseService->uploadFile($request->file('profile_picture'), 'profile-pictures');
            if ($profilePictureUrl) {
                $data['profile_picture'] = $profilePictureUrl;
            }
        }
        
        // Handle cover image upload
        if ($request->hasFile('cover_image')) {
            // Delete old cover image if exists
            if ($user->cover_image) {
                $supabaseService->deleteFile($user->cover_image);
            }
            $coverImageUrl = $supabaseService->uploadFile($request->file('cover_image'), 'cover-images');
            if ($coverImageUrl) {
                $data['cover_image'] = $coverImageUrl;
            }
        }
        
        $user->update($data);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => new UserResource($user->fresh()),
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

        // Delete old profile picture if exists
        if ($user->profile_picture) {
            $supabaseService->deleteFile($user->profile_picture);
        }

        // Upload new profile picture
        $profilePictureUrl = $supabaseService->uploadFile($request->file('profile_picture'), 'profile-pictures');
        
        if (!$profilePictureUrl) {
            return response()->json([
                'message' => 'Failed to upload profile picture',
            ], 500);
        }

        $user->update(['profile_picture' => $profilePictureUrl]);

        return response()->json([
            'message' => 'Profile picture uploaded successfully',
            'user' => new UserResource($user->fresh()),
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
        ]);

        $user = $request->user();
        $prefs = $user->notification_preferences ?? User::defaultNotificationPreferences();
        $updated = array_merge($prefs, $request->input('notification_preferences', []));
        $user->update(['notification_preferences' => $updated]);

        return response()->json([
            'message' => 'Notification preferences updated',
            'notification_preferences' => $user->fresh()->notification_preferences,
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
