<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\ModerationEvent;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register a new user.
     *
     * @param RegisterRequest $request
     * @return JsonResponse
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $data = [
            'name' => $request->name,
            'email' => $request->email,
            'username' => $request->username,
            'password' => Hash::make($request->password),
            'bio' => $request->bio ?? null,
        ];

        $user = User::create($data);

        // Handle profile picture upload after user exists (optional: registration succeeds even if Supabase fails)
        if ($request->hasFile('profile_picture')) {
            try {
                $supabaseService = app(\App\Services\SupabaseService::class);
                $file = $request->file('profile_picture');

                // Archive copy – best-effort, per-user folder for media tab history
                try {
                    $supabaseService->uploadFile($file, 'profile-pictures/profile-pictures-storage/' . $user->id);
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::warning('Profile picture archive upload failed during registration, continuing without it.', ['error' => $e->getMessage()]);
                }

                // Current profile picture
                $currentProfileUrl = $supabaseService->uploadFile($file, 'profile-pictures/profile-picture');
                if ($currentProfileUrl) {
                    $user->update(['profile_picture' => $currentProfileUrl]);
                }
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('Profile picture upload failed during registration, continuing without it.', ['error' => $e->getMessage()]);
            }
        }

        $user->sendEmailVerificationNotification();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'User registered successfully. Please verify your email.',
            'user' => new UserResource($user),
            'token' => $token,
        ], 201);
    }

    /**
     * Login user and create token.
     *
     * @param LoginRequest $request
     * @return JsonResponse
     * @throws ValidationException
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $login = $request->input('email');
        $user = str_contains($login, '@')
            ? User::where('email', $login)->first()
            : User::where('username', $login)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user->clearExpiredSuspensionIfNeeded();
        $user->refresh();

        if ($user->banned_at !== null) {
            $banEvent = ModerationEvent::query()
                ->where('user_id', $user->id)
                ->where('action', ModerationEvent::ACTION_BAN)
                ->orderByDesc('id')
                ->first();

            // Some older bans might have `users.banned_at` set without a corresponding
            // `moderation_events` row. Ensure we always have a ban event so the
            // member can submit an in-app appeal.
            if (! $banEvent && Schema::hasTable('moderation_events')) {
                $banEvent = ModerationEvent::create([
                    'user_id' => $user->id,
                    'admin_id' => null,
                    'action' => ModerationEvent::ACTION_BAN,
                    'reason_code' => null,
                    'message' => null,
                    'meta' => null,
                ]);
            }

            $appealToken = null;
            if ($banEvent?->id) {
                $appealToken = Crypt::encryptString(json_encode([
                    'moderation_event_id' => $banEvent->id,
                    'user_id' => $user->id,
                ]));
            }

            return response()->json([
                'message' => 'This account has been permanently banned.',
                'code' => 'account_banned',
                'reason_code' => $banEvent?->reason_code,
                'ban_message' => $banEvent?->message,
                'moderation_event_id' => $banEvent?->id,
                'appeal_token' => $appealToken,
            ], 403);
        }

        if ($user->isSuspended()) {
            throw ValidationException::withMessages([
                'email' => ['Your account has been suspended. Please contact support.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        if ($user->hasTwoFactorEnabled()) {
            return response()->json([
                'message' => 'Two-factor authentication required',
                'requires_two_factor' => true,
                'user' => new UserResource($user),
                'token' => $token,
            ]);
        }

        return response()->json([
            'message' => 'Login successful',
            'user' => new UserResource($user),
            'token' => $token,
        ]);
    }

    /**
     * Logout user (Revoke the token).
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    /**
     * Get authenticated user.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function user(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->clearExpiredSuspensionIfNeeded();
        $user->refresh();

        return response()->json([
            'user' => new UserResource($user->loadCount(['followers', 'following'])),
        ]);
    }

    /**
     * Verify email (signed URL from verification email).
     * Redirects to frontend with ?verified=1 on success.
     *
     * @param Request $request
     * @return JsonResponse|\Illuminate\Http\RedirectResponse
     */
    public function verifyEmail(Request $request)
    {
        if (!URL::hasValidSignature($request)) {
            return response()->json(['message' => 'Invalid or expired verification link.'], 403);
        }

        $user = User::findOrFail($request->route('id'));

        if (!hash_equals((string) $request->route('hash'), sha1($user->getEmailForVerification()))) {
            return response()->json(['message' => 'Invalid verification link.'], 403);
        }

        if ($user->hasVerifiedEmail()) {
            return $this->redirectToFrontend($request, true);
        }

        $user->markEmailAsVerified();
        event(new Verified($user));

        return $this->redirectToFrontend($request, true);
    }

    /**
     * Resend verification email (authenticated).
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function resendVerification(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified.'], 400);
        }

        $user->sendEmailVerificationNotification();

        return response()->json(['message' => 'Verification link sent.']);
    }

    /**
     * Redirect to frontend with verified param.
     *
     * @param Request $request
     * @param bool $verified
     * @return \Illuminate\Http\RedirectResponse
     */
    private function redirectToFrontend(Request $request, bool $verified = false)
    {
        $frontend = rtrim(config('app.frontend_url', env('FRONTEND_URL', $request->getSchemeAndHttpHost())), '/');
        $url = $frontend . '/login' . ($verified ? '?verified=1' : '');

        return redirect()->away($url);
    }

    /**
     * Send password reset link to email (forgot password).
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        $status = Password::sendResetLink($request->only('email'));

        if ($status === Password::RESET_LINK_SENT) {
            return response()->json(['message' => 'If that email exists, we have sent a password reset link.']);
        }

        return response()->json(
            ['message' => 'If that email exists, we have sent a password reset link.'],
            200
        );
    }

    /**
     * Reset password with token from email.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|min:8|confirmed',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                ])->setRememberToken(Str::random(60));

                $user->save();

                event(new PasswordReset($user));
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json(['message' => 'Password has been reset. You can sign in now.']);
        }

        return response()->json(
            ['message' => 'This password reset link is invalid or has expired.'],
            400
        );
    }
}
