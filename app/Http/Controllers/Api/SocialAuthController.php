<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    /**
     * Redirect to Google OAuth.
     */
    public function redirectToGoogle(): RedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    /**
     * Handle Google OAuth callback.
     */
    public function handleGoogleCallback(Request $request): RedirectResponse
    {
        return $this->handleProviderCallback('google');
    }

    /**
     * Redirect to Facebook OAuth.
     */
    public function redirectToFacebook(): RedirectResponse
    {
        return Socialite::driver('facebook')->redirect();
    }

    /**
     * Handle Facebook OAuth callback.
     */
    public function handleFacebookCallback(Request $request): RedirectResponse
    {
        return $this->handleProviderCallback('facebook');
    }

    /**
     * Handle OAuth provider callback and redirect to frontend with token.
     */
    private function handleProviderCallback(string $provider): RedirectResponse
    {
        try {
            $socialUser = Socialite::driver($provider)->user();
        } catch (\Exception $e) {
            return $this->redirectToFrontendWithError('Could not authenticate with ' . $provider);
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
