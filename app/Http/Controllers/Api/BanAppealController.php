<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BanAppeal;
use App\Models\ModerationEvent;
use App\Models\User;
use App\Notifications\BanAppealSubmittedNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Schema;

class BanAppealController extends Controller
{
    /**
     * Submit an account-ban appeal while the user is blocked (no auth required).
     */
    public function store(Request $request): JsonResponse
    {
        if (! Schema::hasTable('ban_appeals')) {
            return response()->json(['message' => 'Ban appeals are not available'], 503);
        }

        $validated = $request->validate([
            'appeal_token' => ['required', 'string'],
            'message' => ['required', 'string', 'min:20', 'max:5000'],
        ]);

        try {
            $payload = json_decode(Crypt::decryptString($validated['appeal_token']), true, 512, JSON_THROW_ON_ERROR);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Invalid or expired appeal token'], 422);
        }

        $moderationEventId = (int) ($payload['moderation_event_id'] ?? 0);
        $userId = (int) ($payload['user_id'] ?? 0);

        if ($moderationEventId <= 0 || $userId <= 0) {
            return response()->json(['message' => 'Invalid appeal token payload'], 422);
        }

        $event = ModerationEvent::query()->findOrFail($moderationEventId);

        if ($event->action !== ModerationEvent::ACTION_BAN) {
            return response()->json(['message' => 'This is not a ban event'], 422);
        }

        if ((int) $event->user_id !== (int) $userId) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $user = $event->user;
        if ($user === null || $user->banned_at === null) {
            return response()->json(['message' => 'This account is not currently banned'], 422);
        }

        if (BanAppeal::query()->where('moderation_event_id', $event->id)->exists()) {
            return response()->json(['message' => 'You have already submitted an appeal for this ban.'], 422);
        }

        $appeal = BanAppeal::create([
            'moderation_event_id' => $event->id,
            'user_id' => $user->id,
            'message' => $validated['message'],
            'status' => BanAppeal::STATUS_PENDING,
        ]);

        $appeal->load(['user', 'moderationEvent']);

        User::query()
            ->whereIn('role', [User::ROLE_ADMIN, User::ROLE_MODERATOR])
            ->get()
            ->each(fn (User $admin) => $admin->notify(new BanAppealSubmittedNotification($appeal)));

        return response()->json([
            'message' => 'Your appeal was submitted. Our team will review it as soon as possible.',
            'appeal' => [
                'id' => $appeal->id,
                'status' => $appeal->status,
            ],
        ], 201);
    }
}

