<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Notifications\AccountSuspendedNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
}
