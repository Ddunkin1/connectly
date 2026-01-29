<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Community\StoreCommunityRequest;
use App\Http\Requests\Community\UpdateCommunityRequest;
use App\Http\Resources\CommunityResource;
use App\Http\Resources\PostResource;
use App\Models\Community;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommunityController extends Controller
{
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

        // Get member IDs
        $memberIds = $community->members()->pluck('user_id')->toArray();
        $memberIds[] = $community->creator_id; // Include creator

        // Get posts from members
        $posts = \App\Models\Post::with(['user', 'hashtags', 'likes'])
            ->whereIn('user_id', $memberIds)
            ->where('visibility', 'public') // Only public posts in communities
            ->withCount(['likes', 'allComments as comments_count'])
            ->latest()
            ->paginate(15);

        // Check if current user liked each post
        if ($user) {
            $likedPostIds = $user->likes()
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
}
