<?php

namespace App\Http\Middleware;

use App\Models\ModerationEvent;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\Response;

class CheckNotBanned
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->banned_at !== null) {
            $banEvent = ModerationEvent::query()
                ->where('user_id', $user->id)
                ->where('action', ModerationEvent::ACTION_BAN)
                ->orderByDesc('id')
                ->first();

            if (! $banEvent && Schema::hasTable('moderation_events')) {
                $banEvent = ModerationEvent::create([
                    'user_id'     => $user->id,
                    'admin_id'    => null,
                    'action'      => ModerationEvent::ACTION_BAN,
                    'reason_code' => null,
                    'message'     => null,
                    'meta'        => null,
                ]);
            }

            $appealToken = null;
            if ($banEvent?->id) {
                $appealToken = Crypt::encryptString(json_encode([
                    'moderation_event_id' => $banEvent->id,
                    'user_id'             => $user->id,
                ]));
            }

            return response()->json([
                'message'              => 'This account has been permanently banned.',
                'code'                 => 'account_banned',
                'reason_code'          => $banEvent?->reason_code,
                'ban_message'          => $banEvent?->message,
                'moderation_event_id'  => $banEvent?->id,
                'appeal_token'         => $appealToken,
            ], 403);
        }

        return $next($request);
    }
}
