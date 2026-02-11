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
            $posts = $user->posts()
                ->with(['user', 'hashtags', 'likes', 'sharedPost.user'])
                ->withCount(['likes', 'allComments as comments_count'])
                ->latest()
                ->paginate(15);

            // Check if current user liked each post (likes table is polymorphic: likeable_id, likeable_type)
            if ($request->user()) {
                $likedPostIds = $request->user()
                    ->likes()
                    ->where('likeable_type', Post::class)
                    ->whereIn('likeable_id', $posts->pluck('id'))
                    ->pluck('likeable_id')
                    ->toArray();

                $posts->getCollection()->transform(function ($post) use ($likedPostIds) {
                    $post->is_liked = in_array($post->id, $likedPostIds);
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

        // Get users not in the following list
        $suggestedUsers = User::whereNotIn('id', $followingIds)
            ->withCount(['followers', 'following'])
            ->limit(10)
            ->get();

        return response()->json([
            'users' => UserResource::collection($suggestedUsers),
        ]);
    }
}
