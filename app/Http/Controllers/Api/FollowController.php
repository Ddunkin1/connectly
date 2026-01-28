<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FollowController extends Controller
{
    /**
     * Follow a user.
     *
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     */
    public function follow(Request $request, User $user): JsonResponse
    {
        $follower = $request->user();

        if ($follower->id === $user->id) {
            return response()->json([
                'message' => 'Cannot follow yourself',
            ], 422);
        }

        if ($follower->isFollowing($user)) {
            return response()->json([
                'message' => 'Already following this user',
            ], 422);
        }

        $follower->following()->attach($user->id);

        return response()->json([
            'message' => 'User followed successfully',
            'following_count' => $follower->following()->count(),
            'followers_count' => $user->followers()->count(),
        ]);
    }

    /**
     * Unfollow a user.
     *
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     */
    public function unfollow(Request $request, User $user): JsonResponse
    {
        $follower = $request->user();

        if (!$follower->isFollowing($user)) {
            return response()->json([
                'message' => 'Not following this user',
            ], 422);
        }

        $follower->following()->detach($user->id);

        return response()->json([
            'message' => 'User unfollowed successfully',
            'following_count' => $follower->following()->count(),
            'followers_count' => $user->followers()->count(),
        ]);
    }
}
