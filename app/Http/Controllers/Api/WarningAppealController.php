<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ModerationEvent;
use App\Models\User;
use App\Models\WarningAppeal;
use App\Notifications\WarningAppealSubmittedNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class WarningAppealController extends Controller
{
    /**
     * Submit an appeal for a formal warning.
     */
    public function store(Request $request): JsonResponse
    {
        if (! Schema::hasTable('warning_appeals')) {
            return response()->json(['message' => 'Appeals are not available'], 503);
        }

        $validated = $request->validate([
            'moderation_event_id' => ['required', 'integer', 'exists:moderation_events,id'],
            'message' => ['required', 'string', 'min:20', 'max:5000'],
        ]);

        $event = ModerationEvent::query()->findOrFail($validated['moderation_event_id']);

        if ($event->action !== ModerationEvent::ACTION_WARNING) {
            return response()->json(['message' => 'This is not a warning event'], 422);
        }

        if ((int) $event->user_id !== (int) $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if (WarningAppeal::query()->where('moderation_event_id', $event->id)->exists()) {
            return response()->json(['message' => 'You have already submitted an appeal for this warning.'], 422);
        }

        $appeal = WarningAppeal::create([
            'moderation_event_id' => $event->id,
            'user_id' => $request->user()->id,
            'message' => $validated['message'],
            'status' => WarningAppeal::STATUS_PENDING,
        ]);

        $appeal->load(['user', 'moderationEvent']);

        User::query()
            ->whereIn('role', [User::ROLE_ADMIN, User::ROLE_MODERATOR])
            ->get()
            ->each(fn (User $admin) => $admin->notify(new WarningAppealSubmittedNotification($appeal)));

        return response()->json([
            'message' => 'Your appeal was submitted. Our team will review it as soon as possible.',
            'appeal' => [
                'id' => $appeal->id,
                'status' => $appeal->status,
            ],
        ], 201);
    }
}
