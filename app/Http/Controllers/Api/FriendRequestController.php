<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\FriendRequestResource;
use App\Models\FriendRequest;
use App\Models\User;
use App\Notifications\FriendRequestNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FriendRequestController extends Controller
{
    /**
     * Get all friend requests for the authenticated user.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // Get pending friend requests received by the user
        $receivedRequests = FriendRequest::where('receiver_id', $user->id)
            ->where('status', 'pending')
            ->with(['sender'])
            ->latest()
            ->get();

        // Get pending friend requests sent by the user
        $sentRequests = FriendRequest::where('sender_id', $user->id)
            ->where('status', 'pending')
            ->with(['receiver'])
            ->latest()
            ->get();

        return response()->json([
            'received' => FriendRequestResource::collection($receivedRequests),
            'sent' => FriendRequestResource::collection($sentRequests),
        ]);
    }

    /**
     * Send a friend request.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function store(Request $request, int $id): JsonResponse
    {
        $sender = $request->user();
        $receiver = User::findOrFail($id);

        if ($sender->id === $receiver->id) {
            return response()->json([
                'message' => 'Cannot send friend request to yourself',
            ], 422);
        }

        // Check if already friends (following each other)
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
                'message' => 'Friend request already exists',
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
            'friend_request' => new FriendRequestResource($friendRequest->load('sender', 'receiver')),
        ], 201);
    }

    /**
     * Accept a friend request.
     *
     * @param Request $request
     * @param FriendRequest $friendRequest
     * @return JsonResponse
     */
    public function accept(Request $request, FriendRequest $friendRequest): JsonResponse
    {
        $user = $request->user();

        // Verify the user is the receiver
        if ($friendRequest->receiver_id !== $user->id) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        if ($friendRequest->status !== 'pending') {
            return response()->json([
                'message' => 'Friend request has already been responded to',
            ], 422);
        }

        // Accept the request
        $friendRequest->accept();

        // Create mutual follow relationship
        $sender = $friendRequest->sender;
        if (!$user->isFollowing($sender)) {
            $user->following()->attach($sender->id);
        }
        if (!$sender->isFollowing($user)) {
            $sender->following()->attach($user->id);
        }

        return response()->json([
            'message' => 'Friend request accepted',
            'friend_request' => new FriendRequestResource($friendRequest->load('sender', 'receiver')),
        ]);
    }

    /**
     * Reject a friend request.
     *
     * @param Request $request
     * @param FriendRequest $friendRequest
     * @return JsonResponse
     */
    public function reject(Request $request, FriendRequest $friendRequest): JsonResponse
    {
        $user = $request->user();

        // Verify the user is the receiver
        if ($friendRequest->receiver_id !== $user->id) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        if ($friendRequest->status !== 'pending') {
            return response()->json([
                'message' => 'Friend request has already been responded to',
            ], 422);
        }

        // Reject the request
        $friendRequest->reject();

        return response()->json([
            'message' => 'Friend request rejected',
            'friend_request' => new FriendRequestResource($friendRequest->load('sender', 'receiver')),
        ]);
    }

    /**
     * Cancel a sent friend request.
     *
     * @param Request $request
     * @param FriendRequest $friendRequest
     * @return JsonResponse
     */
    public function cancel(Request $request, FriendRequest $friendRequest): JsonResponse
    {
        $user = $request->user();

        // Verify the user is the sender
        if ($friendRequest->sender_id !== $user->id) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        if ($friendRequest->status !== 'pending') {
            return response()->json([
                'message' => 'Friend request has already been responded to',
            ], 422);
        }

        $friendRequest->delete();

        return response()->json([
            'message' => 'Friend request cancelled',
        ]);
    }
}
