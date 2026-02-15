<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Models\PollOption;
use App\Models\PollVote;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PollVoteController extends Controller
{
    /**
     * Vote on a poll (upsert - one vote per user per poll).
     */
    public function vote(Request $request, Post $post): JsonResponse
    {
        $request->validate([
            'poll_option_id' => ['required', 'integer', 'exists:poll_options,id'],
        ]);

        $poll = $post->poll;
        if (!$poll) {
            return response()->json(['message' => 'This post has no poll'], 404);
        }

        $option = PollOption::find($request->poll_option_id);
        if ($option->poll_id !== $poll->id) {
            return response()->json(['message' => 'Invalid poll option'], 422);
        }

        $user = $request->user();

        PollVote::updateOrCreate(
            [
                'user_id' => $user->id,
                'poll_id' => $poll->id,
            ],
            [
                'poll_option_id' => $option->id,
            ]
        );

        $post->load(['user', 'hashtags', 'sharedPost.user', 'poll.options']);

        return response()->json([
            'message' => 'Vote recorded',
            'post' => new PostResource($post),
        ]);
    }
}
