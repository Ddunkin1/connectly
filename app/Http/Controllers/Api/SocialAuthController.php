<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ModerationEvent;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    /**
     * Redirect to Google OAuth.
     */
    public function redirectToGoogle(): RedirectResponse
    {
        return Socialite::driver('google')->stateless()->redirect();
    }

    /**
     * Handle Google OAuth callback.
     */
    public function handleGoogleCallback(Request $request): RedirectResponse
    {
        return $this->handleProviderCallback('google');
    }

    /**
     * Handle OAuth provider callback and redirect to frontend with token.
     */
    private function handleProviderCallback(string $provider): RedirectResponse
    {
        try {
            $socialUser = Socialite::driver($provider)->stateless()->user();
        } catch (\Exception $e) {
            Log::error('Social auth failed', [
                'provider' => $provider,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            $message = config('app.debug')
                ? 'Could not authenticate with ' . $provider . ': ' . $e->getMessage()
                : 'Could not authenticate with ' . $provider . '. Check storage/logs/laravel.log for details.';
            return $this->redirectToFrontendWithError($message);
        }

        $email = $socialUser->getEmail();
        if (empty($email)) {
            return $this->redirectToFrontendWithError('Your ' . $provider . ' account must have an email address to sign in.');
        }

        $user = User::where('provider', $provider)
            ->where('provider_id', $socialUser->getId())
            ->first();

        if (!$user) {
            $existingUser = User::where('email', $email)->first();

            if ($existingUser) {
                $existingUser->update([
                    'provider' => $provider,
                    'provider_id' => $socialUser->getId(),
                    'email_verified_at' => $existingUser->email_verified_at ?? now(),
                ]);
                $user = $existingUser;
            } else {
                $user = User::create([
                    'name' => $socialUser->getName() ?? $socialUser->getNickname() ?? 'User',
                    'email' => $email,
                    'username' => $this->uniqueUsername(Str::slug($socialUser->getName() ?? $socialUser->getId())),
                    'provider' => $provider,
                    'provider_id' => $socialUser->getId(),
                    'profile_picture' => $socialUser->getAvatar(),
                    'email_verified_at' => now(),
                ]);
            }
        }

        $user->refresh();
        $user->clearExpiredSuspensionIfNeeded();
        $user->refresh();

        if ($user->banned_at !== null) {
            $banEvent = ModerationEvent::query()
                ->where('user_id', $user->id)
                ->where('action', ModerationEvent::ACTION_BAN)
                ->orderByDesc('id')
                ->first();
            $frontend = rtrim(config('app.frontend_url', env('FRONTEND_URL', env('APP_URL'))), '/');
            $qs = $banEvent?->reason_code
                ? '?reason_code=' . rawurlencode($banEvent->reason_code)
                : '';

            return redirect()->away($frontend . '/account-banned' . $qs);
        }

        if ($user->isSuspended()) {
            return $this->redirectToFrontendWithError('Your account has been suspended.');
        }

        $token = $user->createToken('auth_token')->plainTextToken;
        $frontend = rtrim(config('app.frontend_url', env('FRONTEND_URL', env('APP_URL'))), '/');

        return redirect()->away($frontend . '/auth/callback?token=' . urlencode($token));
    }

    private function uniqueUsername(string $base): string
    {
        $username = $base;
        $count = 0;

        while (User::where('username', $username)->exists()) {
            $count++;
            $username = $base . $count;
        }

        return $username;
    }

    private function redirectToFrontendWithError(string $message): RedirectResponse
    {
        $frontend = rtrim(config('app.frontend_url', env('FRONTEND_URL', env('APP_URL'))), '/');

        return redirect()->away($frontend . '/login?error=' . urlencode($message));
    }
}
