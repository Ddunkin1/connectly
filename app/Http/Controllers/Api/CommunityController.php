<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Community\StoreCommunityRequest;
use App\Http\Requests\Community\UpdateCommunityRequest;
use App\Http\Resources\CommunityResource;
use App\Http\Resources\PostResource;
use App\Models\Community;
use App\Models\CommunityPost;
use App\Models\Post;
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
        
        // Check if current user is a member
        $isMember = false;
        if ($request->user()) {
            $isMember = $community->members()->where('user_id', $request->user()->id)->exists() 
                     || $community->creator_id === $request->user()->id;
        }

        return response()->json([
            'community' => new CommunityResource($community),
            'is_member' => $isMember,
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
    public function join(Request $request, Community $community): JsonResponse
    {
        $user = $request->user();

        // Check if user is already a member
        if ($community->members()->where('user_id', $user->id)->exists()) {
            return response()->json([
                'message' => 'You are already a member of this community',
            ], 400);
        }

        // Add user as member
        $community->members()->attach($user->id, [
            'role' => 'member',
            'joined_at' => now(),
        ]);

        return response()->json([
            'message' => 'Successfully joined community',
            'community' => new CommunityResource($community->load(['creator', 'members'])->loadCount('members')),
        ]);
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
}
