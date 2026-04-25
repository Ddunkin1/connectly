<?php

namespace App\Http\Controllers\Api;

use App\Events\CallEnded;
use App\Events\CallInitiated;
use App\Http\Controllers\Controller;
use App\Models\Conversation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CallController extends Controller
{
    /**
     * Generate an Agora RTC token for a one-on-one video call.
     *
     * POST /api/calls/token
     * Body: { conversation_id }
     */
    public function generateToken(Request $request): JsonResponse
    {
        $request->validate(['conversation_id' => ['required', 'integer', 'exists:conversations,id']]);

        $conversation = $this->findAuthorizedConversation($request->conversation_id);

        return response()->json([
            'room_name' => 'connectly-call-' . $conversation->id,
        ]);
    }

    /**
     * Signal the other participant that an incoming call is starting.
     *
     * POST /api/calls/initiate
     * Body: { conversation_id }
     */
    public function initiate(Request $request): JsonResponse
    {
        $request->validate(['conversation_id' => ['required', 'integer', 'exists:conversations,id']]);

        $conversation = $this->findAuthorizedConversation($request->conversation_id);
        $caller       = Auth::user();
        $recipient    = $conversation->getOtherUser($caller);

        event(new CallInitiated(
            recipientId:    $recipient->id,
            callerId:       $caller->id,
            callerName:     $caller->name,
            callerAvatar:   $caller->profile_picture ?? '',
            channelName:    'call_conversation_' . $conversation->id,
            conversationId: $conversation->id,
        ));

        return response()->json(['status' => 'initiated']);
    }

    /**
     * Signal the other participant that the call has ended.
     *
     * POST /api/calls/end
     * Body: { conversation_id }
     */
    public function end(Request $request): JsonResponse
    {
        $request->validate(['conversation_id' => ['required', 'integer', 'exists:conversations,id']]);

        $conversation = $this->findAuthorizedConversation($request->conversation_id);
        $caller       = Auth::user();
        $recipient    = $conversation->getOtherUser($caller);

        event(new CallEnded(
            recipientId:    $recipient->id,
            conversationId: $conversation->id,
        ));

        return response()->json(['status' => 'ended']);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private function findAuthorizedConversation(int $conversationId): Conversation
    {
        $conversation = Conversation::where('id', $conversationId)
            ->where(function ($q) {
                $q->where('user_one_id', Auth::id())
                  ->orWhere('user_two_id', Auth::id());
            })
            ->firstOrFail();

        return $conversation;
    }
}
