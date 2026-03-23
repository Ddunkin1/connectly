<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\BanAppeal;
use App\Models\ModerationEvent;
use App\Notifications\BanAppealAnsweredNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class AdminBanAppealController extends Controller
{
    /**
     * Pending ban appeals (newest first).
     */
    public function index(Request $request): JsonResponse
    {
        if (! Schema::hasTable('ban_appeals')) {
            return response()->json(['message' => 'Ban appeals are not available'], 503);
        }

        $appeals = BanAppeal::query()
            ->with([
                'user:id,name,username,profile_picture,email',
                'moderationEvent' => fn ($q) => $q->with('admin:id,name,username'),
            ])
            ->where('status', BanAppeal::STATUS_PENDING)
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($appeals);
    }

    /**
     * Respond to a ban appeal.
     * - approve/unban: lifts `banned_at` and sends a notification to the user.
     * - dismiss: keeps the ban in place.
     */
    public function respond(Request $request, BanAppeal $banAppeal): JsonResponse
    {
        if (! Schema::hasTable('ban_appeals')) {
            return response()->json(['message' => 'Ban appeals are not available'], 503);
        }

        if ($banAppeal->status !== BanAppeal::STATUS_PENDING) {
            return response()->json(['message' => 'This appeal is no longer pending'], 422);
        }

        $validated = $request->validate([
            'reply' => ['required', 'string', 'min:10', 'max:5000'],
            'unban' => ['sometimes', 'boolean'],
        ]);

        $unban = (bool) ($validated['unban'] ?? false);

        $banAppeal->update([
            'status' => $unban ? BanAppeal::STATUS_APPROVED : BanAppeal::STATUS_DISMISSED,
            'admin_reply' => $validated['reply'],
            'answered_by' => $request->user()->id,
            'answered_at' => now(),
        ]);

        $moderationEvent = $banAppeal->relationLoaded('moderationEvent') ? $banAppeal->moderationEvent : $banAppeal->moderationEvent()->first();
        $user = $banAppeal->user;

        if ($unban && $user) {
            $user->update([
                'banned_at' => null,
            ]);

            if (Schema::hasTable('moderation_events')) {
                ModerationEvent::create([
                    'user_id' => $user->id,
                    'admin_id' => $request->user()->id,
                    'action' => ModerationEvent::ACTION_UNBAN,
                    'reason_code' => $moderationEvent?->reason_code,
                    'message' => $validated['reply'],
                    'meta' => null,
                ]);
            }
        }

        $banAppeal->user->notify(new BanAppealAnsweredNotification(
            $validated['reply'],
            $banAppeal->moderation_event_id
        ));

        return response()->json([
            'message' => $unban ? 'Appeal approved; user unbanned.' : 'Appeal dismissed; user remains banned.',
            'appeal' => $banAppeal->fresh(),
        ]);
    }
}

