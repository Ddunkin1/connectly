<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\UpdateProfileRequest;
use App\Http\Requests\User\UploadProfilePictureRequest;
use App\Http\Resources\PostResource;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\MediaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
        $posts = $user->posts()
            ->with(['user', 'hashtags', 'likes'])
            ->withCount(['likes', 'allComments as comments_count'])
            ->latest()
            ->paginate(15);

        // Check if current user liked each post
        if ($request->user()) {
            $likedPostIds = $request->user()
                ->likes()
                ->whereIn('post_id', $posts->pluck('id'))
                ->pluck('post_id')
                ->toArray();

            $posts->getCollection()->transform(function ($post) use ($likedPostIds) {
                $post->is_liked = in_array($post->id, $likedPostIds);
                return $post;
            });
        }

        return response()->json([
            'posts' => PostResource::collection($posts->items()),
            'pagination' => [
                'current_page' => $posts->currentPage(),
                'last_page' => $posts->lastPage(),
                'per_page' => $posts->perPage(),
                'total' => $posts->total(),
            ],
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
        
        // Handle cover_image_url separately if provided
        if (isset($data['cover_image_url'])) {
            $user->cover_image = $data['cover_image_url'];
            unset($data['cover_image_url']);
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

        // Save EdgeStore URL directly
        $user->update(['profile_picture' => $request->profile_picture_url]);

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
