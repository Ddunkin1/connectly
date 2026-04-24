<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\ModerationEvent;
use App\Models\Post;
use App\Models\ProfileComment;
use App\Models\Report;
use App\Models\User;
use App\Notifications\AccountBannedNotification;
use App\Notifications\AccountSuspendedNotification;
use App\Notifications\ModerationWarningNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminUserController extends Controller
{
    /**
     * Summary counts for admin dashboard cards.
     */
    public function stats(): JsonResponse
    {
        $weekStart = now()->startOfWeek();

        return response()->json([
            'total_users' => User::query()->count(),
            'new_this_week' => User::query()->where('created_at', '>=', $weekStart)->count(),
            'suspended' => User::query()->whereNotNull('suspended_at')->count(),
            'banned' => User::query()->whereNotNull('banned_at')->count(),
        ]);
    }

    /**
     * List all users for admin. Use ?export=csv for CSV download (same filters as list).
     */
    public function index(Request $request): JsonResponse|StreamedResponse
    {
        if ($request->input('export') === 'csv' || $request->boolean('export_csv')) {
            return $this->exportCsv($request);
        }

        $perPage = $request->input('per_page', 20);
        $search = $request->input('q', '');
        $role = $request->input('role', '');

        $query = User::withCount(['posts', 'followers', 'following']);

        if ($search) {
            $term = '%' . $search . '%';
            $query->where(function ($q) use ($term) {
                $q->where('name', 'LIKE', $term)
                    ->orWhere('username', 'LIKE', $term)
                    ->orWhere('email', 'LIKE', $term);
            });
        }

        if ($role && in_array($role, [User::ROLE_ADMIN, User::ROLE_MODERATOR, User::ROLE_USER], true)) {
            $query->where('role', $role);
        }
        // By default, don't list other admins in the "Admin / Users" moderation table.
        // (Admins can still be queried explicitly by passing `role=admin`.)
        if (empty($role)) {
            $query->where('role', '!=', User::ROLE_ADMIN);
        }

        $users = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'users' => UserResource::collection($users->items()),
            'pagination' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    /**
     * Export users as CSV (same filters as index, no pagination).
     */
    private function exportCsv(Request $request): StreamedResponse
    {
        $search = $request->input('q', '');
        $role = $request->input('role', '');

        $query = User::query()->orderBy('created_at', 'desc');

        if ($search) {
            $term = '%' . $search . '%';
            $query->where(function ($q) use ($term) {
                $q->where('name', 'LIKE', $term)
                    ->orWhere('username', 'LIKE', $term)
                    ->orWhere('email', 'LIKE', $term);
            });
        }

        if ($role && in_array($role, [User::ROLE_ADMIN, User::ROLE_MODERATOR, User::ROLE_USER], true)) {
            $query->where('role', $role);
        }

        $filename = 'users-export-' . now()->format('Y-m-d-His') . '.csv';

        return response()->streamDownload(function () use ($query) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['id', 'name', 'username', 'email', 'role', 'suspended_at', 'created_at']);
            $query->chunk(500, function ($users) use ($out) {
                foreach ($users as $u) {
                    fputcsv($out, [
                        $u->id,
                        $u->name,
                        $u->username,
                        $u->email,
                        $u->role,
                        $u->suspended_at?->toIso8601String() ?? '',
                        $u->created_at?->toIso8601String() ?? '',
                    ]);
                }
            });
            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * Update user role.
     */
    public function updateRole(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'role' => ['required', 'in:admin,moderator,user'],
        ]);

        $user->update(['role' => $request->role]);

        return response()->json([
            'message' => 'User role updated',
            'user' => new UserResource($user->fresh()),
        ]);
    }

    /**
     * Suspend a user. Optional `duration`: 1d, 3d, 7d, 14d, 30d, 90d, 180d, 365d, indefinite (default).
     */
    public function suspend(Request $request, User $user): JsonResponse
    {
        if ($user->isAdmin()) {
            return response()->json(['message' => 'Cannot suspend an admin'], 400);
        }

        $request->validate([
            'duration' => ['nullable', 'string', Rule::in([
                '1d', '3d', '7d', '14d', '30d', '90d', '180d', '365d', 'indefinite',
            ])],
        ]);

        $duration = $request->input('duration', 'indefinite');
        $now = now();

        $until = match ($duration) {
            '1d' => $now->copy()->addDay(),
            '3d' => $now->copy()->addDays(3),
            '7d' => $now->copy()->addDays(7),
            '14d' => $now->copy()->addDays(14),
            '30d' => $now->copy()->addDays(30),
            '90d' => $now->copy()->addDays(90),
            '180d' => $now->copy()->addDays(180),
            '365d' => $now->copy()->addDays(365),
            default => null,
        };

        $user->update([
            'suspended_at' => $now,
            'suspended_until' => $until,
        ]);

        if (Schema::hasTable('moderation_events')) {
            ModerationEvent::create([
                'user_id' => $user->id,
                'admin_id' => $request->user()->id,
                'action' => ModerationEvent::ACTION_SUSPEND,
                'reason_code' => null,
                'message' => null,
                'meta' => [
                    'duration' => $duration,
                    'suspended_until' => $until?->toIso8601String(),
                ],
            ]);
        }

        $user->notify(new AccountSuspendedNotification($until));

        $fresh = $user->fresh();

        return response()->json([
            'message' => $until !== null
                ? 'User suspended until ' . $until->toDateTimeString() . ' (UTC).'
                : 'User suspended until further notice.',
            'user' => new UserResource($fresh),
        ]);
    }

    /**
     * Unsuspend a user.
     */
    public function unsuspend(User $user): JsonResponse
    {
        $user->update([
            'suspended_at' => null,
            'suspended_until' => null,
        ]);

        return response()->json([
            'message' => 'User unsuspended',
            'user' => new UserResource($user->fresh()),
        ]);
    }

    /**
     * User detail for admin moderation modal (violations, reports against user, activity).
     */
    public function moderationDetails(User $user): JsonResponse
    {
        $user->loadCount(['posts', 'followers', 'following']);
        $commentsCount = ProfileComment::where('author_id', $user->id)->count();
        $lastPostAt = $user->posts()->max('created_at');
        $lastActive = $lastPostAt !== null ? \Carbon\Carbon::parse($lastPostAt) : $user->updated_at;

        // Bargraph-friendly analytics: posts created per day (last 7 days)
        $days = 7;
        $start = now()->subDays($days - 1)->startOfDay();
        $end = now()->endOfDay();
        $rawCounts = Post::query()
            ->where('user_id', $user->id)
            ->where('is_archived', false)
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw('DATE(created_at) as day, COUNT(*) as count')
            ->groupBy('day')
            ->pluck('count', 'day');

        $postsPerDay = [];
        for ($i = 0; $i < $days; $i++) {
            $d = $start->copy()->addDays($i);
            $key = $d->toDateString();
            $postsPerDay[] = [
                'date' => $key,
                'count' => (int) ($rawCounts[$key] ?? 0),
            ];
        }

        $violations = collect();
        if (Schema::hasTable('moderation_events')) {
            $violations = ModerationEvent::query()
                ->where('user_id', $user->id)
                ->with('admin:id,name,username')
                ->orderByDesc('created_at')
                ->limit(50)
                ->get()
                ->map(fn (ModerationEvent $e) => [
                    'id' => $e->id,
                    'action' => $e->action,
                    'reason_code' => $e->reason_code,
                    'message' => $e->message,
                    'meta' => $e->meta,
                    'created_at' => $e->created_at?->toIso8601String(),
                    'admin' => $e->admin ? [
                        'username' => $e->admin->username,
                        'name' => $e->admin->name,
                    ] : null,
                ]);
        }

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'profile_picture' => $user->profile_picture,
                'created_at' => $user->created_at?->toIso8601String(),
                'role' => $user->role,
                'banned_at' => $user->banned_at?->toIso8601String(),
                'suspended_at' => $user->suspended_at?->toIso8601String(),
                'suspended_until' => $user->suspended_until?->toIso8601String(),
            ],
            'activity' => [
                'posts_count' => $user->posts_count,
                'comments_count' => $commentsCount,
                'followers_count' => $user->followers_count,
                'following_count' => $user->following_count,
                'last_active_at' => $lastActive?->toIso8601String(),
                'posts_per_day' => $postsPerDay,
            ],
            'violations' => $violations,
            'reports' => $this->reportsAgainstUser($user),
        ]);
    }

    /**
     * Send a formal warning (notification + violation log).
     */
    public function warn(Request $request, User $user): JsonResponse
    {
        if ($user->isAdmin()) {
            return response()->json(['message' => 'Cannot warn an admin account'], 400);
        }

        $validated = $request->validate([
            'reason' => ['required', 'string', Rule::in(Report::REASONS)],
            'message' => ['required', 'string', 'max:5000'],
            'post_id' => ['nullable', 'integer', 'exists:posts,id'],
        ]);

        if (! empty($validated['post_id'])) {
            $post = Post::query()->find((int) $validated['post_id']);
            if (!$post || (int) $post->user_id !== (int) $user->id) {
                return response()->json(['message' => 'Post does not belong to this user.'], 422);
            }
        }

        $event = null;
        if (Schema::hasTable('moderation_events')) {
            $meta = [];
            if (! empty($validated['post_id'])) {
                $meta['post_id'] = (int) $validated['post_id'];
            }
            $event = ModerationEvent::create([
                'user_id' => $user->id,
                'admin_id' => $request->user()->id,
                'action' => ModerationEvent::ACTION_WARNING,
                'reason_code' => $validated['reason'],
                'message' => $validated['message'],
                'meta' => $meta ?: null,
            ]);
        }

        $user->notify(new ModerationWarningNotification(
            $validated['reason'],
            $validated['message'],
            isset($validated['post_id']) ? (int) $validated['post_id'] : null,
            $event?->id
        ));

        return response()->json(['message' => 'Warning sent to the user.']);
    }

    /**
     * Permanent ban (blocks sign-in).
     */
    public function ban(Request $request, User $user): JsonResponse
    {
        if ($user->isAdmin()) {
            return response()->json(['message' => 'Cannot ban an admin account'], 400);
        }

        if ($user->banned_at !== null) {
            return response()->json(['message' => 'User is already banned'], 400);
        }

        $validated = $request->validate([
            'reason' => ['required', 'string', Rule::in(Report::REASONS)],
            'message' => ['required', 'string', 'min:10', 'max:2000'],
        ]);

        $user->update([
            'banned_at' => now(),
            'suspended_at' => null,
            'suspended_until' => null,
        ]);

        if (Schema::hasTable('moderation_events')) {
            ModerationEvent::create([
                'user_id' => $user->id,
                'admin_id' => $request->user()->id,
                'action' => ModerationEvent::ACTION_BAN,
                'reason_code' => $validated['reason'],
                'message' => $validated['message'],
            ]);
        }

        $user->notify(new AccountBannedNotification($validated['message'], $validated['reason']));

        $user->tokens()->delete();

        return response()->json([
            'message' => 'User banned.',
            'user' => new UserResource($user->fresh()),
        ]);
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function reportsAgainstUser(User $user): array
    {
        $postIds = $user->posts()->pluck('id');
        $commentIds = ProfileComment::where('author_id', $user->id)->pluck('id');

        $query = Report::query()
            ->with(['reporter:id,username,name'])
            ->orderByDesc('created_at')
            ->limit(40);

        $query->where(function ($q) use ($user, $postIds, $commentIds) {
            $q->where('reportable_type', User::class)->where('reportable_id', $user->id);
            if ($postIds->isNotEmpty()) {
                $q->orWhere(function ($q2) use ($postIds) {
                    $q2->where('reportable_type', Post::class)->whereIn('reportable_id', $postIds);
                });
            }
            if ($commentIds->isNotEmpty()) {
                $q->orWhere(function ($q3) use ($commentIds) {
                    $q3->where('reportable_type', ProfileComment::class)->whereIn('reportable_id', $commentIds);
                });
            }
        });

        return $query->get()->map(function (Report $r) {
            return [
                'id' => $r->id,
                'reason' => $r->reason,
                'status' => $r->status,
                'description' => $r->description,
                'created_at' => $r->created_at?->toIso8601String(),
                'reporter' => $r->reporter ? [
                    'username' => $r->reporter->username,
                    'name' => $r->reporter->name,
                ] : null,
            ];
        })->all();
    }
}
