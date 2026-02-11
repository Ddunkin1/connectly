<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    /**
     * List all users for admin.
     */
    public function index(Request $request): JsonResponse
    {
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
     * Suspend a user.
     */
    public function suspend(User $user): JsonResponse
    {
        if ($user->isAdmin()) {
            return response()->json(['message' => 'Cannot suspend an admin'], 400);
        }

        $user->update(['suspended_at' => now()]);

        return response()->json([
            'message' => 'User suspended',
            'user' => new UserResource($user->fresh()),
        ]);
    }

    /**
     * Unsuspend a user.
     */
    public function unsuspend(User $user): JsonResponse
    {
        $user->update(['suspended_at' => null]);

        return response()->json([
            'message' => 'User unsuspended',
            'user' => new UserResource($user->fresh()),
        ]);
    }
}
