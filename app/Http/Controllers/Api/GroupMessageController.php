<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GroupConversation;
use App\Models\GroupMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GroupMessageController extends Controller
{
    /**
     * Send a message to a group conversation.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'group_conversation_id' => 'required|integer|exists:group_conversations,id',
            'content' => 'required|string|max:5000',
        ]);

        $group = GroupConversation::findOrFail($request->group_conversation_id);

        if (!$group->isMember($request->user())) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $message = GroupMessage::create([
            'group_conversation_id' => $group->id,
            'sender_id' => $request->user()->id,
            'content' => $request->content,
        ]);

        $message->load('sender');

        return response()->json([
            'message' => $message,
        ], 201);
    }
}
