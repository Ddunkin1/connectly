<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GroupConversation;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GroupConversationController extends Controller
{
    /**
     * List group conversations for the current user.
     */
    public function index(Request $request): JsonResponse
    {
        $groups = $request->user()
            ->groupConversations()
            ->with(['creator', 'members'])
            ->latest()
            ->paginate(20);

        return response()->json([
            'groups' => $groups->items(),
            'pagination' => [
                'current_page' => $groups->currentPage(),
                'last_page' => $groups->lastPage(),
                'per_page' => $groups->perPage(),
                'total' => $groups->total(),
            ],
        ]);
    }

    /**
     * Create a group conversation.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'member_ids' => 'required|array',
            'member_ids.*' => 'integer|exists:users,id',
        ]);

        $user = $request->user();
        $memberIds = array_unique(array_map('intval', $request->member_ids));

        // Remove self if present
        $memberIds = array_values(array_filter($memberIds, fn ($id) => $id !== $user->id));

        $group = GroupConversation::create([
            'name' => $request->name,
            'created_by' => $user->id,
        ]);

        $group->members()->attach($user->id, ['role' => 'admin']);
        foreach ($memberIds as $id) {
            $group->members()->attach($id, ['role' => 'member']);
        }

        $group->load(['creator', 'members']);

        return response()->json([
            'message' => 'Group created',
            'group' => $group,
        ], 201);
    }

    /**
     * Get a group conversation with messages.
     */
    public function show(Request $request, GroupConversation $groupConversation): JsonResponse
    {
        if (!$groupConversation->isMember($request->user())) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $groupConversation->load(['creator', 'members']);
        $messages = $groupConversation->groupMessages()
            ->with('sender')
            ->latest()
            ->paginate(50);

        return response()->json([
            'group' => $groupConversation,
            'messages' => $messages->items(),
            'pagination' => [
                'current_page' => $messages->currentPage(),
                'last_page' => $messages->lastPage(),
                'per_page' => $messages->perPage(),
                'total' => $messages->total(),
            ],
        ]);
    }

    /**
     * Add members to group (admin only).
     */
    public function addMembers(Request $request, GroupConversation $groupConversation): JsonResponse
    {
        if (!$groupConversation->isMember($request->user())) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        if (!$groupConversation->isAdmin($request->user())) {
            return response()->json(['message' => 'Only admins can add members'], 403);
        }

        $request->validate([
            'member_ids' => 'required|array',
            'member_ids.*' => 'integer|exists:users,id',
        ]);

        $memberIds = array_unique(array_map('intval', $request->member_ids));
        $existingIds = $groupConversation->members()->pluck('user_id')->toArray();
        $toAdd = array_values(array_filter($memberIds, fn ($id) => !in_array($id, $existingIds)));

        foreach ($toAdd as $id) {
            $groupConversation->members()->attach($id, ['role' => 'member']);
        }

        $groupConversation->load(['creator', 'members']);

        return response()->json([
            'message' => count($toAdd) . ' member(s) added',
            'group' => $groupConversation,
        ]);
    }

    /**
     * Remove a member from group (admin only).
     */
    public function removeMember(Request $request, GroupConversation $groupConversation, User $user): JsonResponse
    {
        if (!$groupConversation->isMember($request->user())) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        if (!$groupConversation->isAdmin($request->user())) {
            return response()->json(['message' => 'Only admins can remove members'], 403);
        }

        if (!$groupConversation->isMember($user)) {
            return response()->json(['message' => 'User is not a member'], 422);
        }

        $groupConversation->members()->detach($user->id);
        $groupConversation->load(['creator', 'members']);

        return response()->json([
            'message' => 'Member removed',
            'group' => $groupConversation,
        ]);
    }

    /**
     * Set nickname for a member (admin or self).
     */
    public function setNickname(Request $request, GroupConversation $groupConversation, User $user): JsonResponse
    {
        if (!$groupConversation->isMember($request->user())) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        if (!$groupConversation->isMember($user)) {
            return response()->json(['message' => 'User is not a member'], 422);
        }

        $currentUser = $request->user();
        $isSelf = $currentUser->id === $user->id;
        $isAdmin = $groupConversation->isAdmin($currentUser);
        if (!$isSelf && !$isAdmin) {
            return response()->json(['message' => 'Only admins can set nicknames for others'], 403);
        }

        $request->validate([
            'nickname' => ['nullable', 'string', 'max:50'],
        ]);

        $groupConversation->members()->updateExistingPivot($user->id, [
            'nickname' => $request->input('nickname') ? trim($request->input('nickname')) : null,
        ]);
        $groupConversation->load(['creator', 'members']);

        return response()->json([
            'message' => 'Nickname updated',
            'group' => $groupConversation,
        ]);
    }
}
