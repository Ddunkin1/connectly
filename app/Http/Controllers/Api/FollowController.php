<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FriendRequest;
use App\Models\User;
use App\Notifications\FriendRequestNotification;
use Illuminate\Database\QueryException;
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

        // Check block status
        if ($sender->hasBlocked($receiver) || $receiver->hasBlocked($sender)) {
            return response()->json([
                'message' => 'Cannot send friend request to this user',
            ], 403);
        }

        // Check if already friends (mutual follow)
        if ($sender->isFollowing($receiver) && $receiver->isFollowing($sender)) {
            return response()->json([
                'message' => 'You are already friends',
            ], 422);
        }

        // Check for existing request from sender to receiver (unique: sender_id + receiver_id)
        $existingRequest = FriendRequest::where('sender_id', $sender->id)
            ->where('receiver_id', $receiver->id)
            ->first();

        if ($existingRequest) {
            if ($existingRequest->status === 'pending') {
                return response()->json([
                    'message' => 'Friend request already sent',
                ], 422);
            }
            if ($existingRequest->status === 'accepted') {
                return response()->json([
                    'message' => 'You are already friends',
                ], 422);
            }
            // Rejected: allow re-requesting
            $existingRequest->update([
                'status' => 'pending',
                'responded_at' => null,
            ]);
            $friendRequest = $existingRequest->fresh(['sender', 'receiver']);
            $receiver->notify(new FriendRequestNotification($friendRequest->load('sender')));

            return response()->json([
                'message' => 'Friend request sent successfully',
                'friend_request_id' => $friendRequest->id,
            ], 201);
        }

        // Check if receiver already sent a pending request to sender
        $incomingRequest = FriendRequest::where('sender_id', $receiver->id)
            ->where('receiver_id', $sender->id)
            ->where('status', 'pending')
            ->first();

        if ($incomingRequest) {
            return response()->json([
                'message' => 'This user has already sent you a friend request. Check your notifications to accept it.',
            ], 422);
        }

        // Create friend request (catch race condition)
        try {
            $friendRequest = FriendRequest::create([
                'sender_id' => $sender->id,
                'receiver_id' => $receiver->id,
                'status' => 'pending',
            ]);
        } catch (QueryException $e) {
            $isDuplicate = in_array($e->getCode(), [23000, '23000'], true)
                && str_contains($e->getMessage(), 'Duplicate entry');
            if ($isDuplicate) {
                return response()->json([
                    'message' => 'Friend request already sent',
                ], 422);
            }
            throw $e;
        }

        // Send notification to receiver
        $receiver->notify(new FriendRequestNotification($friendRequest->load('sender')));

        return response()->json([
            'message' => 'Friend request sent successfully',
            'friend_request_id' => $friendRequest->id,
        ], 201);
    }

    /**
     * Unfollow a user (or remove friendship if connected via accepted friend request).
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function unfollow(Request $request, int $id): JsonResponse
    {
        $follower = $request->user();
        $user = User::findOrFail($id);

        $wasFollowing = $follower->isFollowing($user);

        // Check for accepted friend request (handles "connected" without follows table entry)
        $acceptedRequest = FriendRequest::where('status', 'accepted')
            ->where(function ($q) use ($follower, $user) {
                $q->where('sender_id', $follower->id)->where('receiver_id', $user->id)
                    ->orWhere('sender_id', $user->id)->where('receiver_id', $follower->id);
            })
            ->first();

        if (!$wasFollowing && !$acceptedRequest) {
            return response()->json([
                'message' => 'Not following this user',
            ], 422);
        }

        // Remove from follows table (both directions to fully disconnect)
        $follower->following()->detach($user->id);
        $user->following()->detach($follower->id);

        // If connected via accepted friend request, mark it as rejected to unfriend
        if ($acceptedRequest) {
            $acceptedRequest->update([
                'status' => 'rejected',
                'responded_at' => now(),
            ]);
        }

        return response()->json([
            'message' => 'User unfollowed successfully',
            'following_count' => $follower->following()->count(),
            'followers_count' => $user->followers()->count(),
        ]);
    }
}
