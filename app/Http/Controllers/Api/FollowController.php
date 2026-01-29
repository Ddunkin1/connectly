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
     * @param int $id
     * @return JsonResponse
     */
    public function follow(Request $request, int $id): JsonResponse
    {
        $follower = $request->user();
        $user = User::findOrFail($id);

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
     * @param int $id
     * @return JsonResponse
     */
    public function unfollow(Request $request, int $id): JsonResponse
    {
        $follower = $request->user();
        $user = User::findOrFail($id);

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
