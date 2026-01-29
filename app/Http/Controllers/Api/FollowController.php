<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FriendRequest;
use App\Models\User;
use App\Notifications\FriendRequestNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FollowController extends Controller
{
    /**
     * Send a friend request (replaces direct follow).
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function follow(Request $request, int $id): JsonResponse
    {
        $sender = $request->user();
        $receiver = User::findOrFail($id);

        if ($sender->id === $receiver->id) {
            return response()->json([
                'message' => 'Cannot send friend request to yourself',
            ], 422);
        }

        // Check if already friends (mutual follow)
        if ($sender->isFollowing($receiver) && $receiver->isFollowing($sender)) {
            return response()->json([
                'message' => 'You are already friends',
            ], 422);
        }

        // Check if there's already a pending request
        $existingRequest = FriendRequest::where(function ($query) use ($sender, $receiver) {
            $query->where('sender_id', $sender->id)
                  ->where('receiver_id', $receiver->id)
                  ->where('status', 'pending');
        })->orWhere(function ($query) use ($sender, $receiver) {
            $query->where('sender_id', $receiver->id)
                  ->where('receiver_id', $sender->id)
                  ->where('status', 'pending');
        })->first();

        if ($existingRequest) {
            return response()->json([
                'message' => 'Friend request already pending',
            ], 422);
        }

        // Create friend request
        $friendRequest = FriendRequest::create([
            'sender_id' => $sender->id,
            'receiver_id' => $receiver->id,
            'status' => 'pending',
        ]);

        // Send notification to receiver
        $receiver->notify(new FriendRequestNotification($friendRequest->load('sender')));

        return response()->json([
            'message' => 'Friend request sent successfully',
            'friend_request_id' => $friendRequest->id,
        ], 201);
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
