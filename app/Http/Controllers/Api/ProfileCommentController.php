<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProfileComment\StoreProfileCommentRequest;
use App\Http\Requests\ProfileComment\UpdateProfileCommentRequest;
use App\Http\Resources\ProfileCommentResource;
use App\Models\ProfileComment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileCommentController extends Controller
{
    /**
     * List comments on a user's profile (top-level only; replies nested). Hidden excluded for non-owner.
     */
    public function index(Request $request, User $user): JsonResponse
    {
        $isOwner = $request->user()->id === $user->id;
        $query = $user->profileComments()
            ->whereNull('parent_comment_id')
            ->with([
                'author',
                'replies' => function ($q) use ($isOwner) {
                    $q->with('author')->orderBy('created_at');
                    if (!$isOwner) {
                        $q->whereNull('hidden_at');
                    }
                },
            ])
            ->orderBy('created_at', 'desc');
        if (!$isOwner) {
            $query->whereNull('hidden_at');
        }
        $comments = $query->paginate(15);

        return response()->json([
            'comments' => ProfileCommentResource::collection($comments->items()),
            'pagination' => [
                'current_page' => $comments->currentPage(),
                'last_page' => $comments->lastPage(),
                'per_page' => $comments->perPage(),
                'total' => $comments->total(),
            ],
        ]);
    }

    /**
     * Add a comment or reply to a user's profile. Both top-level comments and replies are allowed from anyone, including the profile owner.
     */
    public function store(StoreProfileCommentRequest $request, User $user): JsonResponse
    {
        $authUser = $request->user();
        $parentCommentId = $request->validated('parent_comment_id');

        if ($parentCommentId) {
            $parent = ProfileComment::find($parentCommentId);
            if (!$parent || $parent->user_id != $user->id) {
                return response()->json(['message' => 'Invalid parent comment.'], 422);
            }
        }

        $comment = $user->profileComments()->create([
            'author_id' => $authUser->id,
            'parent_comment_id' => $parentCommentId,
            'content' => $request->content,
        ]);

        $comment->load('author');

        return response()->json([
            'message' => 'Comment added.',
            'comment' => new ProfileCommentResource($comment),
        ], 201);
    }

    /**
     * Update a profile comment (author only).
     */
    public function update(UpdateProfileCommentRequest $request, ProfileComment $profileComment): JsonResponse
    {
        $this->authorize('update', $profileComment);

        $profileComment->update(['content' => $request->content]);
        $profileComment->load('author');

        return response()->json([
            'message' => 'Comment updated.',
            'comment' => new ProfileCommentResource($profileComment),
        ]);
    }

    /**
     * Hide a profile comment (profile owner only). Comment stays in list for owner with "Unhide" option.
     */
    public function hide(Request $request, ProfileComment $profileComment): JsonResponse
    {
        $this->authorize('hide', $profileComment);

        $profileComment->update(['hidden_at' => now()]);

        return response()->json(['message' => 'Comment hidden.']);
    }

    /**
     * Unhide a profile comment (profile owner only).
     */
    public function unhide(Request $request, ProfileComment $profileComment): JsonResponse
    {
        $this->authorize('hide', $profileComment);

        $profileComment->update(['hidden_at' => null]);

        return response()->json(['message' => 'Comment unhidden.']);
    }

    /**
     * Delete a profile comment (author or profile owner).
     */
    public function destroy(Request $request, ProfileComment $profileComment): JsonResponse
    {
        $this->authorize('delete', $profileComment);

        $profileComment->delete();

        return response()->json(['message' => 'Comment deleted.']);
    }
}
