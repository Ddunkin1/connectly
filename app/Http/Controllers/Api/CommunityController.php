<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Community\StoreCommunityRequest;
use App\Http\Requests\Community\UpdateCommunityRequest;
use App\Http\Resources\CommunityResource;
use App\Http\Resources\PostResource;
use App\Models\Community;
use App\Models\CommunityInvite;
use App\Models\CommunityJoinRequest;
use App\Models\CommunityPost;
use App\Models\Post;
use App\Notifications\CommunityInviteNotification;
use App\Notifications\CommunityInviteSuggestedNotification;
use App\Notifications\CommunityJoinRequestApprovedNotification;
use App\Notifications\CommunityJoinRequestNotification;
use App\Notifications\CommunityJoinRequestRejectedNotification;
use App\Notifications\CommunityMemberJoinedNotification;
use App\Services\PostService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommunityController extends Controller
{
    public function __construct(
        private PostService $postService
    ) {
    }

    /**
     * List all communities with pagination.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $communities = Community::with(['creator'])
            ->withCount('members')
            ->latest()
            ->paginate(15);

        // Add membership status for each community
        $communities->getCollection()->transform(function ($community) use ($user) {
            $community->is_member = false;
            if ($user) {
                $community->is_member = $community->members()->where('user_id', $user->id)->exists() 
                                      || $community->creator_id === $user->id;
            }
            return $community;
        });

        return response()->json([
            'communities' => CommunityResource::collection($communities->items()),
            'pagination' => [
                'current_page' => $communities->currentPage(),
                'last_page' => $communities->lastPage(),
                'per_page' => $communities->perPage(),
                'total' => $communities->total(),
            ],
        ]);
    }

    /**
     * Get a single community's details.
     *
     * @param Request $request
     * @param Community $community
     * @return JsonResponse
     */
    public function show(Request $request, Community $community): JsonResponse
    {
        $community->load(['creator']);
        $community->loadCount('members');
        
        $isMember = false;
        $hasPendingJoinRequest = false;
        if ($request->user()) {
            $isMember = $community->members()->where('user_id', $request->user()->id)->exists() 
                     || $community->creator_id === $request->user()->id;
            if (!$isMember) {
                $hasPendingJoinRequest = $community->joinRequests()
                    ->where('user_id', $request->user()->id)
                    ->where('status', CommunityJoinRequest::STATUS_PENDING)
                    ->exists();
            }
        }

        $resource = new CommunityResource($community);
        $resource->is_member = $isMember;

        return response()->json([
            'community' => $resource,
            'is_member' => $isMember,
            'has_pending_join_request' => $hasPendingJoinRequest,
        ]);
    }

    /**
     * Create a new community.
     *
     * @param StoreCommunityRequest $request
     * @return JsonResponse
     */
    public function store(StoreCommunityRequest $request): JsonResponse
    {
        $user = $request->user();

        $community = Community::create([
            'name' => $request->name,
            'description' => $request->description,
            'privacy' => $request->privacy,
            'requires_approval' => $request->boolean('requires_approval'),
            'creator_id' => $user->id,
        ]);

        // Add creator as admin member
        $community->members()->attach($user->id, [
            'role' => 'admin',
            'joined_at' => now(),
        ]);

        $community->load(['creator', 'members']);
        $community->loadCount('members');

        return response()->json([
            'message' => 'Community created successfully',
            'community' => new CommunityResource($community),
        ], 201);
    }

    /**
     * Update community details.
     *
     * @param UpdateCommunityRequest $request
     * @param Community $community
     * @return JsonResponse
     */
    public function update(UpdateCommunityRequest $request, Community $community): JsonResponse
    {
        $this->authorize('update', $community);

        $community->update($request->validated());

        $community->load(['creator', 'members']);
        $community->loadCount('members');

        return response()->json([
            'message' => 'Community updated successfully',
            'community' => new CommunityResource($community),
        ]);
    }

    /**
     * Delete a community.
     *
     * @param Request $request
     * @param Community $community
     * @return JsonResponse
     */
    public function destroy(Request $request, Community $community): JsonResponse
    {
        $this->authorize('delete', $community);

        $community->delete();

        return response()->json([
            'message' => 'Community deleted successfully',
        ]);
    }

    /**
     * Join a community.
     *
     * @param Request $request
     * @param Community $community
     * @return JsonResponse
     */
    /**
     * Request to join a community (admin must approve).
     */
    public function join(Request $request, Community $community): JsonResponse
    {
        $user = $request->user();

        if ($community->members()->where('user_id', $user->id)->exists() || $community->creator_id === $user->id) {
            return response()->json(['message' => 'You are already a member of this community'], 400);
        }

        $existing = $community->joinRequests()->where('user_id', $user->id)->first();
        if ($existing) {
            if ($existing->status === CommunityJoinRequest::STATUS_PENDING) {
                return response()->json(['message' => 'You already have a pending request'], 400);
            }
            $existing->update(['status' => CommunityJoinRequest::STATUS_PENDING]);
            $joinRequest = $existing;
        } else {
            $joinRequest = $community->joinRequests()->create([
                'user_id' => $user->id,
                'status' => CommunityJoinRequest::STATUS_PENDING,
            ]);
        }

        if ($community->creator_id && $community->creator_id !== $user->id) {
            $community->creator->notify(new CommunityJoinRequestNotification($joinRequest));
        }

        $community->load(['creator'])->loadCount('members');
        $resource = new CommunityResource($community);
        $resource->is_member = false;

        return response()->json([
            'message' => 'Request to join sent. You will be notified when the admin responds.',
            'has_pending_join_request' => true,
            'community' => $resource,
        ]);
    }

    /**
     * Cancel own pending join request.
     */
    public function cancelJoinRequest(Request $request, Community $community): JsonResponse
    {
        $user = $request->user();
        $joinRequest = $community->joinRequests()
            ->where('user_id', $user->id)
            ->where('status', CommunityJoinRequest::STATUS_PENDING)
            ->first();

        if (!$joinRequest) {
            return response()->json(['message' => 'No pending request found'], 404);
        }

        $joinRequest->update(['status' => CommunityJoinRequest::STATUS_REJECTED]);

        return response()->json([
            'message' => 'Join request cancelled',
            'has_pending_join_request' => false,
        ]);
    }

    /**
     * List pending join requests (admin only).
     */
    public function joinRequests(Request $request, Community $community): JsonResponse
    {
        if ($community->creator_id !== $request->user()->id && !$community->isModerator($request->user())) {
            return response()->json(['message' => 'Only the community admin can view join requests'], 403);
        }

        $requests = $community->joinRequests()
            ->where('status', CommunityJoinRequest::STATUS_PENDING)
            ->with('user')
            ->latest()
            ->get()
            ->map(fn (CommunityJoinRequest $r) => [
                'id' => $r->id,
                'user_id' => $r->user_id,
                'user' => $r->user ? [
                    'id' => $r->user->id,
                    'name' => $r->user->name,
                    'username' => $r->user->username,
                    'profile_picture' => $r->user->profile_picture,
                ] : null,
                'created_at' => $r->created_at?->toIso8601String(),
            ]);

        return response()->json(['join_requests' => $requests]);
    }

    /**
     * Approve a join request (admin only).
     */
    public function approveJoinRequest(Request $request, Community $community, CommunityJoinRequest $joinRequest): JsonResponse
    {
        if ($community->creator_id !== $request->user()->id && !$community->isModerator($request->user())) {
            return response()->json(['message' => 'Only the community admin can approve requests'], 403);
        }
        if ($joinRequest->community_id != $community->id || $joinRequest->status !== CommunityJoinRequest::STATUS_PENDING) {
            return response()->json(['message' => 'Invalid request'], 422);
        }

        $joinRequest->update(['status' => CommunityJoinRequest::STATUS_APPROVED]);
        $community->members()->syncWithoutDetaching([
            $joinRequest->user_id => ['role' => 'member', 'joined_at' => now()],
        ]);

        $joinRequest->user->notify(new CommunityJoinRequestApprovedNotification($community));
        if ($community->creator_id && $community->creator_id !== $joinRequest->user_id) {
            $community->creator->notify(new CommunityMemberJoinedNotification($community, $joinRequest->user));
        }

        return response()->json([
            'message' => 'Join request approved',
            'join_request' => ['id' => $joinRequest->id, 'status' => $joinRequest->status],
        ]);
    }

    /**
     * Reject a join request (admin only).
     */
    public function rejectJoinRequest(Request $request, Community $community, CommunityJoinRequest $joinRequest): JsonResponse
    {
        if ($community->creator_id !== $request->user()->id && !$community->isModerator($request->user())) {
            return response()->json(['message' => 'Only the community admin can reject requests'], 403);
        }
        if ($joinRequest->community_id != $community->id || $joinRequest->status !== CommunityJoinRequest::STATUS_PENDING) {
            return response()->json(['message' => 'Invalid request'], 422);
        }

        $joinRequest->update(['status' => CommunityJoinRequest::STATUS_REJECTED]);
        $joinRequest->user->notify(new CommunityJoinRequestRejectedNotification($community));

        return response()->json([
            'message' => 'Join request rejected',
            'join_request' => ['id' => $joinRequest->id, 'status' => $joinRequest->status],
        ]);
    }

    /**
     * List community members. Any member of the community can view the list.
     */
    public function members(Request $request, Community $community): JsonResponse
    {
        $isMember = $community->members()->where('user_id', $request->user()->id)->exists()
            || $community->creator_id === $request->user()->id;
        if (!$isMember) {
            return response()->json(['message' => 'You must be a member to view the member list'], 403);
        }

        // Ensure creator is in members table (for communities created before we added attach in store())
        if ($community->creator_id && !$community->members()->where('user_id', $community->creator_id)->exists()) {
            $community->members()->syncWithoutDetaching([
                $community->creator_id => [
                    'role' => 'admin',
                    'joined_at' => now(),
                ],
            ]);
        }

        $list = $community->members()->get()->map(function ($user) use ($community) {
            $joinedAt = $user->pivot->joined_at ?? null;
            $joinedAtStr = $joinedAt instanceof \Carbon\Carbon
                ? $joinedAt->toIso8601String()
                : (is_string($joinedAt) ? $joinedAt : null);
            $role = $user->pivot->role ?? 'member';
            $isCreator = $user->id === $community->creator_id;
            return [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'profile_picture' => $user->profile_picture,
                'role' => $role,
                'is_creator' => $isCreator,
                'joined_at' => $joinedAtStr,
            ];
        })->values()->all();

        // Creator first (super admin), then admins/moderators, then members
        usort($list, function ($a, $b) {
            if ($a['is_creator'] ?? false) return -1;
            if ($b['is_creator'] ?? false) return 1;
            $adminRoles = ['admin', 'moderator'];
            $aIsAdmin = in_array($a['role'] ?? '', $adminRoles);
            $bIsAdmin = in_array($b['role'] ?? '', $adminRoles);
            if ($aIsAdmin && !$bIsAdmin) return -1;
            if (!$aIsAdmin && $bIsAdmin) return 1;
            return 0;
        });

        return response()->json(['members' => $list]);
    }

    /**
     * Update a member's role. Only creator (super admin) can demote admins to member; creator and admins can promote.
     */
    public function updateMemberRole(Request $request, Community $community, \App\Models\User $user): JsonResponse
    {
        $userId = $user->id;
        $currentUser = $request->user();
        if ($community->creator_id !== $currentUser->id && !$community->isModerator($currentUser)) {
            return response()->json(['message' => 'Only the community admin can change roles'], 403);
        }
        if ($community->creator_id === $userId) {
            return response()->json(['message' => 'Cannot change the creator\'s role'], 422);
        }

        $request->validate(['role' => 'required|in:admin,moderator,member']);
        $newRole = $request->input('role');

        // Only the creator (super admin) can demote someone to regular member
        if ($newRole === 'member') {
            if ($community->creator_id !== $currentUser->id) {
                return response()->json(['message' => 'Only the community creator can remove admin role'], 403);
            }
        }

        $exists = $community->members()->where('user_id', $userId)->exists();
        if (!$exists) {
            return response()->json(['message' => 'User is not a member'], 404);
        }

        $community->members()->updateExistingPivot($userId, ['role' => $newRole]);

        return response()->json([
            'message' => 'Role updated',
            'member' => ['user_id' => $userId, 'role' => $newRole],
        ]);
    }

    /**
     * Remove (kick) a member from the community. Only the creator (super admin) can kick.
     */
    public function removeMember(Request $request, Community $community, \App\Models\User $user): JsonResponse
    {
        $currentUser = $request->user();
        if ($community->creator_id !== $currentUser->id) {
            return response()->json(['message' => 'Only the community creator can remove members'], 403);
        }

        $userId = $user->id;
        if ($community->creator_id === $userId) {
            return response()->json(['message' => 'Creator cannot leave this way; use Delete community'], 422);
        }

        if (!$community->members()->where('user_id', $userId)->exists()) {
            return response()->json(['message' => 'User is not a member'], 404);
        }

        $community->members()->detach($userId);

        return response()->json(['message' => 'Member removed']);
    }

    /**
     * Leave a community.
     *
     * @param Request $request
     * @param Community $community
     * @return JsonResponse
     */
    public function leave(Request $request, Community $community): JsonResponse
    {
        $user = $request->user();

        // Creator cannot leave
        if ($community->creator_id === $user->id) {
            return response()->json([
                'message' => 'Community creator cannot leave the community',
            ], 400);
        }

        // Check if user is a member
        if (!$community->members()->where('user_id', $user->id)->exists()) {
            return response()->json([
                'message' => 'You are not a member of this community',
            ], 400);
        }

        // Remove user from members
        $community->members()->detach($user->id);

        return response()->json([
            'message' => 'Successfully left community',
        ]);
    }

    /**
     * Get all posts from community members.
     *
     * @param Request $request
     * @param Community $community
     * @return JsonResponse
     */
    public function posts(Request $request, Community $community): JsonResponse
    {
        $user = $request->user();

        // Check if user is a member (for private communities)
        if ($community->privacy === 'private') {
            $isMember = $community->members()->where('user_id', $user->id)->exists();
            if (!$isMember && $community->creator_id !== $user->id) {
                return response()->json([
                    'message' => 'You must be a member to view posts',
                ], 403);
            }
        }

        $memberIds = $community->members()->pluck('user_id')->toArray();
        $memberIds[] = $community->creator_id;

        // When requires_approval: show only approved community posts
        if ($community->requires_approval ?? false) {
            $postIds = $community->communityPosts()
                ->where('status', CommunityPost::STATUS_APPROVED)
                ->pluck('post_id');
            $posts = Post::with(['user', 'hashtags', 'likes', 'poll.options'])
                ->whereIn('id', $postIds)
                ->withCount(['likes', 'allComments as comments_count'])
                ->latest()
                ->paginate(15);
        } else {
            $posts = Post::with(['user', 'hashtags', 'likes', 'poll.options'])
                ->whereIn('user_id', $memberIds)
                ->where('visibility', 'public')
                ->withCount(['likes', 'allComments as comments_count'])
                ->latest()
                ->paginate(15);
        }

        // Check if current user liked each post (likes table is polymorphic: likeable_id, likeable_type)
        if ($user) {
            $likedPostIds = $user->likes()
                ->where('likeable_type', Post::class)
                ->whereIn('likeable_id', $posts->pluck('id'))
                ->pluck('likeable_id')
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
     * Submit a post to a community.
     */
    public function submitPost(Request $request, Community $community): JsonResponse
    {
        $user = $request->user();

        $isMember = $community->members()->where('user_id', $user->id)->exists()
            || $community->creator_id === $user->id;
        if (!$isMember) {
            return response()->json(['message' => 'You must be a member to post'], 403);
        }

        $request->validate([
            'content' => 'nullable|string|max:5000',
            'media' => 'nullable|file|max:51200',
        ]);
        if (empty(trim($request->input('content', ''))) && !$request->hasFile('media')) {
            return response()->json(['message' => 'Content or media is required'], 422);
        }

        $post = $this->postService->createPost($user, array_merge($request->all(), ['visibility' => 'public']));

        $status = $community->requires_approval ? CommunityPost::STATUS_PENDING : CommunityPost::STATUS_APPROVED;
        CommunityPost::create([
            'community_id' => $community->id,
            'post_id' => $post->id,
            'user_id' => $user->id,
            'status' => $status,
        ]);

        return response()->json([
            'message' => $status === CommunityPost::STATUS_PENDING
                ? 'Post submitted and is pending approval'
                : 'Post added to community',
            'post' => new PostResource($post->load(['user', 'hashtags'])),
        ], 201);
    }

    /**
     * Approve a pending community post (moderators only).
     */
    public function approvePost(Request $request, Community $community, Post $post): JsonResponse
    {
        if (!$community->isModerator($request->user())) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $cp = CommunityPost::where('community_id', $community->id)->where('post_id', $post->id)->first();
        if (!$cp || $cp->status !== CommunityPost::STATUS_PENDING) {
            return response()->json(['message' => 'Post not found or not pending'], 404);
        }

        $cp->update([
            'status' => CommunityPost::STATUS_APPROVED,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        return response()->json(['message' => 'Post approved']);
    }

    /**
     * Reject a pending community post (moderators only).
     */
    public function rejectPost(Request $request, Community $community, Post $post): JsonResponse
    {
        if (!$community->isModerator($request->user())) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $cp = CommunityPost::where('community_id', $community->id)->where('post_id', $post->id)->first();
        if (!$cp || $cp->status !== CommunityPost::STATUS_PENDING) {
            return response()->json(['message' => 'Post not found or not pending'], 404);
        }

        $cp->update([
            'status' => CommunityPost::STATUS_REJECTED,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        return response()->json(['message' => 'Post rejected']);
    }

    /**
     * List pending posts for moderators.
     */
    public function pendingPosts(Request $request, Community $community): JsonResponse
    {
        if (!$community->isModerator($request->user())) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $items = $community->communityPosts()
            ->where('status', CommunityPost::STATUS_PENDING)
            ->with(['post.user', 'user'])
            ->latest()
            ->paginate(15);

        return response()->json([
            'posts' => PostResource::collection($items->pluck('post')),
            'pagination' => [
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
            ],
        ]);
    }

    /**
     * Invite a user to the community (admin/creator only). Direct invite — user gets notification and can accept/decline.
     */
    public function invite(Request $request, Community $community): JsonResponse
    {
        $user = $request->user();
        if ($community->creator_id !== $user->id) {
            return response()->json(['message' => 'Only the community admin can invite users directly'], 403);
        }

        $request->validate(['user_id' => 'required|integer|exists:users,id']);
        $invitedUserId = (int) $request->user_id;
        if ($invitedUserId === $user->id) {
            return response()->json(['message' => 'You cannot invite yourself'], 422);
        }
        if ($community->members()->where('user_id', $invitedUserId)->exists() || $community->creator_id === $invitedUserId) {
            return response()->json(['message' => 'User is already a member'], 422);
        }

        $existing = $community->invites()->where('invited_user_id', $invitedUserId)->first();
        if ($existing) {
            if (in_array($existing->status, [CommunityInvite::STATUS_PENDING, CommunityInvite::STATUS_PENDING_APPROVAL], true)) {
                return response()->json(['message' => 'Invite already sent or pending approval'], 422);
            }
            // Re-invite (e.g. after they were kicked or previously declined): reuse row
            $existing->update([
                'inviter_id' => $user->id,
                'status' => CommunityInvite::STATUS_PENDING,
            ]);
            $invite = $existing->fresh();
        } else {
            $invite = $community->invites()->create([
                'invited_user_id' => $invitedUserId,
                'inviter_id' => $user->id,
                'status' => CommunityInvite::STATUS_PENDING,
            ]);
        }
        $invite->load(['invitedUser', 'inviter', 'community']);
        $invite->invitedUser->notify(new CommunityInviteNotification($invite));

        return response()->json(['message' => 'Invite sent', 'invite' => $this->inviteToArray($invite)], 201);
    }

    /**
     * Suggest inviting a user (member). Creates pending_approval — admin must approve or reject.
     */
    public function suggestInvite(Request $request, Community $community): JsonResponse
    {
        $user = $request->user();
        $isMember = $community->members()->where('user_id', $user->id)->exists() || $community->creator_id === $user->id;
        if (!$isMember) {
            return response()->json(['message' => 'You must be a member to suggest invites'], 403);
        }
        if ($community->creator_id === $user->id) {
            return response()->json(['message' => 'Use the direct Invite action as admin'], 422);
        }

        $request->validate(['user_id' => 'required|integer|exists:users,id']);
        $invitedUserId = (int) $request->user_id;
        if ($community->members()->where('user_id', $invitedUserId)->exists() || $community->creator_id === $invitedUserId) {
            return response()->json(['message' => 'User is already a member'], 422);
        }

        $existing = $community->invites()->where('invited_user_id', $invitedUserId)->first();
        if ($existing) {
            if (in_array($existing->status, [CommunityInvite::STATUS_PENDING, CommunityInvite::STATUS_PENDING_APPROVAL], true)) {
                return response()->json(['message' => 'Invite already sent or pending approval'], 422);
            }
            // Re-suggest (e.g. after they were kicked or previously rejected): reuse row
            $existing->update([
                'inviter_id' => $user->id,
                'status' => CommunityInvite::STATUS_PENDING_APPROVAL,
            ]);
            $invite = $existing->fresh();
        } else {
            $invite = $community->invites()->create([
                'invited_user_id' => $invitedUserId,
                'inviter_id' => $user->id,
                'status' => CommunityInvite::STATUS_PENDING_APPROVAL,
            ]);
        }
        $invite->load(['invitedUser', 'inviter', 'community']);
        $community->creator->notify(new CommunityInviteSuggestedNotification($invite));

        return response()->json(['message' => 'Suggestions sent to community admin for approval', 'invite' => $this->inviteToArray($invite)], 201);
    }

    /**
     * Admin approves a member-suggested invite — adds user to community and notifies them.
     */
    public function approveInvite(Request $request, Community $community, CommunityInvite $invite): JsonResponse
    {
        if ($community->creator_id !== $request->user()->id) {
            return response()->json(['message' => 'Only the community admin can approve invites'], 403);
        }
        if ($invite->community_id != $community->id || $invite->status !== CommunityInvite::STATUS_PENDING_APPROVAL) {
            return response()->json(['message' => 'Invalid invite'], 422);
        }

        $invite->update(['status' => CommunityInvite::STATUS_ACCEPTED]);
        $community->members()->syncWithoutDetaching([$invite->invited_user_id => ['role' => 'member', 'joined_at' => now()]]);
        if ($community->creator_id && $community->creator_id !== $invite->invited_user_id) {
            $community->creator->notify(new CommunityMemberJoinedNotification($community, $invite->invitedUser));
        }
        return response()->json(['message' => 'Invite approved', 'invite' => $this->inviteToArray($invite->fresh())]);
    }

    /**
     * Admin rejects a member-suggested invite.
     */
    public function rejectInvite(Request $request, Community $community, CommunityInvite $invite): JsonResponse
    {
        if ($community->creator_id !== $request->user()->id) {
            return response()->json(['message' => 'Only the community admin can reject invites'], 403);
        }
        if ($invite->community_id != $community->id || $invite->status !== CommunityInvite::STATUS_PENDING_APPROVAL) {
            return response()->json(['message' => 'Invalid invite'], 422);
        }
        $invite->update(['status' => CommunityInvite::STATUS_REJECTED]);
        return response()->json(['message' => 'Invite rejected']);
    }

    /**
     * Invited user accepts an invite (direct invite only).
     */
    public function acceptInvite(Request $request, Community $community, CommunityInvite $invite): JsonResponse
    {
        if ($invite->invited_user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        if ($invite->community_id != $community->id || $invite->status !== CommunityInvite::STATUS_PENDING) {
            return response()->json(['message' => 'Invalid or expired invite'], 422);
        }

        $invite->update(['status' => CommunityInvite::STATUS_ACCEPTED]);
        $community->members()->syncWithoutDetaching([$request->user()->id => ['role' => 'member', 'joined_at' => now()]]);
        if ($community->creator_id && $community->creator_id !== $request->user()->id) {
            $community->creator->notify(new CommunityMemberJoinedNotification($community, $request->user()));
        }
        return response()->json([
            'message' => 'You joined the community',
            'community' => new CommunityResource($community->load(['creator', 'members'])->loadCount('members')),
        ]);
    }

    /**
     * Invited user declines an invite.
     */
    public function declineInvite(Request $request, Community $community, CommunityInvite $invite): JsonResponse
    {
        if ($invite->invited_user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        if ($invite->community_id != $community->id || $invite->status !== CommunityInvite::STATUS_PENDING) {
            return response()->json(['message' => 'Invalid or expired invite'], 422);
        }
        $invite->update(['status' => CommunityInvite::STATUS_REJECTED]);
        return response()->json(['message' => 'Invite declined']);
    }

    /**
     * List pending invites for this community (admin: pending_approval; also list sent direct invites).
     */
    public function pendingInvites(Request $request, Community $community): JsonResponse
    {
        $user = $request->user();
        if ($community->creator_id !== $user->id) {
            return response()->json(['message' => 'Only the community admin can view pending invites'], 403);
        }

        $invites = $community->invites()
            ->whereIn('status', [CommunityInvite::STATUS_PENDING, CommunityInvite::STATUS_PENDING_APPROVAL])
            ->with(['invitedUser', 'inviter'])
            ->latest()
            ->get();

        return response()->json(['invites' => $invites->map(fn ($i) => $this->inviteToArray($i))]);
    }

    private function inviteToArray(CommunityInvite $invite): array
    {
        $invite->loadMissing(['invitedUser', 'inviter', 'community']);
        return [
            'id' => $invite->id,
            'community_id' => $invite->community_id,
            'invited_user_id' => $invite->invited_user_id,
            'inviter_id' => $invite->inviter_id,
            'status' => $invite->status,
            'invited_user' => $invite->invitedUser ? ['id' => $invite->invitedUser->id, 'name' => $invite->invitedUser->name, 'username' => $invite->invitedUser->username, 'profile_picture' => $invite->invitedUser->profile_picture] : null,
            'inviter' => $invite->inviter ? ['id' => $invite->inviter->id, 'name' => $invite->inviter->name, 'username' => $invite->inviter->username] : null,
            'created_at' => $invite->created_at?->toIso8601String(),
        ];
    }
}
