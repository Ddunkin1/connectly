<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ModerationEvent;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * User views context for a formal warning (linked post, appeal status).
 */
class WarningEventController extends Controller
{
    public function show(Request $request, ModerationEvent $moderationEvent): JsonResponse
    {
        if ($moderationEvent->action !== ModerationEvent::ACTION_WARNING) {
            return response()->json(['message' => 'Not found'], 404);
        }

        if ((int) $moderationEvent->user_id !== (int) $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $postId = $moderationEvent->meta['post_id'] ?? null;
        $post = null;
        if ($postId) {
            $post = Post::query()->with('user:id,username,name,profile_picture')->find($postId);
        }

        $appeal = $moderationEvent->warningAppeal;

        return response()->json([
            'event' => [
                'id' => $moderationEvent->id,
                'reason_code' => $moderationEvent->reason_code,
                'message' => $moderationEvent->message,
                'created_at' => $moderationEvent->created_at?->toIso8601String(),
            ],
            'post' => $post ? [
                'id' => $post->id,
                'content' => $post->content,
                'media_url' => $post->media_url,
                'media_type' => $post->media_type,
                'created_at' => $post->created_at?->toIso8601String(),
                'user' => $post->user,
            ] : null,
            'appeal' => $appeal ? [
                'id' => $appeal->id,
                'status' => $appeal->status,
                'message' => $appeal->message,
                'admin_reply' => $appeal->admin_reply,
                'answered_at' => $appeal->answered_at?->toIso8601String(),
            ] : null,
        ]);
    }
}
