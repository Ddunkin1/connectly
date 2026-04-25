<?php

namespace App\Http\Controllers\Api;

use App\Events\CallAccepted;
use App\Events\CallEnded;
use App\Events\CallInitiated;
use App\Events\MessageSent;
use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Services\AgoraToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class CallController extends Controller
{
    /**
     * Generate an Agora RTC token for the caller/callee to join a channel.
     *
     * POST /api/calls/token
     * Body: { conversation_id }
     */
    public function generateToken(Request $request): JsonResponse
    {
        $request->validate(['conversation_id' => ['required', 'integer', 'exists:conversations,id']]);

        $conversation = $this->findAuthorizedConversation($request->conversation_id);
        $user         = Auth::user();

        $appId       = config('services.agora.app_id');
        $certificate = config('services.agora.app_certificate');
        $channel     = 'connectly-call-' . $conversation->id;
        $uid         = $user->id;

        $token = AgoraToken::buildRtcToken($appId, $certificate, $channel, $uid);

        return response()->json([
            'app_id'       => $appId,
            'token'        => $token,
            'channel_name' => $channel,
            'uid'          => $uid,
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

        // Remember who initiated so end() can label the message correctly
        Cache::put("call_initiator_{$conversation->id}", $caller->id, now()->addHour());

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
     * Signal the caller that the callee accepted the call.
     *
     * POST /api/calls/accept
     * Body: { conversation_id }
     */
    public function accept(Request $request): JsonResponse
    {
        $request->validate(['conversation_id' => ['required', 'integer', 'exists:conversations,id']]);

        $conversation = $this->findAuthorizedConversation($request->conversation_id);
        $acceptor     = Auth::user();
        $caller       = $conversation->getOtherUser($acceptor);

        event(new CallAccepted(
            recipientId:    $caller->id,
            conversationId: $conversation->id,
        ));

        return response()->json(['status' => 'accepted']);
    }

    /**
     * Signal the other participant that the call has ended.
     *
     * POST /api/calls/end
     * Body: { conversation_id }
     */
    public function end(Request $request): JsonResponse
    {
        $request->validate([
            'conversation_id' => ['required', 'integer', 'exists:conversations,id'],
            'status'          => ['nullable', 'string', 'in:missed,ended'],
            'duration'        => ['nullable', 'integer', 'min:0'],
        ]);

        $conversation = $this->findAuthorizedConversation($request->conversation_id);
        $caller       = Auth::user();
        $recipient    = $conversation->getOtherUser($caller);

        $status      = $request->input('status', 'ended');
        $duration    = (int) $request->input('duration', 0);
        $initiatorId = Cache::pull("call_initiator_{$conversation->id}") ?? $caller->id;

        // Format: call_missed:{initiatorId}  or  call_ended:{duration}:{initiatorId}
        $body = $status === 'ended'
            ? "call_ended:{$duration}:{$initiatorId}"
            : "call_missed:{$initiatorId}";

        $callMessage = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id'       => $caller->id,
            'receiver_id'     => $recipient->id,
            'message'         => $body,
            'type'            => 'call',
            'is_read'         => false,
        ]);
        $callMessage->load(['sender', 'receiver']);
        broadcast(new MessageSent($callMessage));

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
