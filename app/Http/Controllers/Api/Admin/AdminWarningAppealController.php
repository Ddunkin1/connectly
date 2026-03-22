<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\WarningAppeal;
use App\Notifications\WarningAppealAnsweredNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminWarningAppealController extends Controller
{
    /**
     * Pending warning appeals (newest first).
     */
    public function index(Request $request): JsonResponse
    {
        $appeals = WarningAppeal::query()
            ->with([
                'user:id,name,username,profile_picture,email',
                'moderationEvent' => fn ($q) => $q->with('admin:id,name,username'),
            ])
            ->where('status', WarningAppeal::STATUS_PENDING)
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($appeals);
    }

    /**
     * Respond to an appeal (user gets a notification).
     */
    public function respond(Request $request, WarningAppeal $warningAppeal): JsonResponse
    {
        if ($warningAppeal->status !== WarningAppeal::STATUS_PENDING) {
            return response()->json(['message' => 'This appeal is no longer pending'], 422);
        }

        $validated = $request->validate([
            'reply' => ['required', 'string', 'min:10', 'max:5000'],
            'dismiss' => ['sometimes', 'boolean'],
        ]);

        $dismiss = (bool) ($validated['dismiss'] ?? false);

        $warningAppeal->update([
            'status' => $dismiss ? WarningAppeal::STATUS_DISMISSED : WarningAppeal::STATUS_ANSWERED,
            'admin_reply' => $validated['reply'],
            'answered_by' => $request->user()->id,
            'answered_at' => now(),
        ]);

        $warningAppeal->user->notify(new WarningAppealAnsweredNotification(
            $validated['reply'],
            $warningAppeal->moderation_event_id
        ));

        return response()->json([
            'message' => $dismiss ? 'Appeal dismissed and user notified.' : 'Reply sent to the user.',
            'appeal' => $warningAppeal->fresh(),
        ]);
    }
}
