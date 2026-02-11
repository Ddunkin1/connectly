<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BlockController extends Controller
{
    /**
     * Block a user.
     */
    public function store(Request $request, int $id): JsonResponse
    {
        $currentUser = $request->user();

        if ($currentUser->id === (int) $id) {
            return response()->json(['message' => 'You cannot block yourself'], 400);
        }

        $userToBlock = User::find($id);
        if (!$userToBlock) {
            return response()->json(['message' => 'User not found'], 404);
        }

        if ($currentUser->hasBlocked($userToBlock)) {
            return response()->json(['message' => 'User is already blocked'], 400);
        }

        $currentUser->blockedUsers()->attach($userToBlock->id);

        // Optionally remove follow/following and friend request relationships
        $currentUser->following()->detach($userToBlock->id);
        $currentUser->followers()->detach($userToBlock->id);

        return response()->json([
            'message' => 'User blocked successfully',
            'user' => new UserResource($userToBlock),
        ]);
    }

    /**
     * Unblock a user.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $currentUser = $request->user();
        $userToUnblock = User::find($id);

        if (!$userToUnblock) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $currentUser->blockedUsers()->detach($userToUnblock->id);

        return response()->json([
            'message' => 'User unblocked successfully',
        ]);
    }

    /**
     * List blocked users.
     */
    public function index(Request $request): JsonResponse
    {
        $blocked = $request->user()
            ->blockedUsers()
            ->withCount(['followers', 'following'])
            ->orderByPivot('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'blocked_users' => UserResource::collection($blocked->items()),
            'pagination' => [
                'current_page' => $blocked->currentPage(),
                'last_page' => $blocked->lastPage(),
                'per_page' => $blocked->perPage(),
                'total' => $blocked->total(),
            ],
        ]);
    }

    /**
     * Check if a user is blocked.
     */
    public function status(Request $request, int $id): JsonResponse
    {
        $currentUser = $request->user();
        $otherUser = User::find($id);

        if (!$otherUser) {
            return response()->json(['message' => 'User not found'], 404);
        }

        return response()->json([
            'is_blocked' => $currentUser->hasBlocked($otherUser),
            'has_blocked_you' => $otherUser->hasBlocked($currentUser),
        ]);
    }
}
