<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use PragmaRX\Google2FA\Google2FA;

class TwoFactorController extends Controller
{
    /**
     * Generate a new 2FA secret and return QR code URL for setup.
     */
    public function setup(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasTwoFactorEnabled()) {
            return response()->json(['message' => 'Two-factor authentication is already enabled.'], 400);
        }

        $google2fa = new Google2FA();
        $secret = $google2fa->generateSecretKey(32);

        $user->forceFill([
            'two_factor_secret' => encrypt($secret),
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ])->save();

        $qrCodeUrl = $google2fa->getQRCodeUrl(
            config('app.name', 'Connectly'),
            $user->email,
            $secret
        );

        return response()->json([
            'secret' => $secret,
            'qr_code_url' => $qrCodeUrl,
        ]);
    }

    /**
     * Confirm 2FA by verifying a code, then enable it.
     */
    public function confirm(Request $request): JsonResponse
    {
        $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ]);

        $user = $request->user();

        if (empty($user->two_factor_secret)) {
            return response()->json(['message' => 'Two-factor setup not started.'], 400);
        }

        $secret = decrypt($user->two_factor_secret);
        $google2fa = new Google2FA();

        if (!$google2fa->verifyKey($secret, $request->code)) {
            return response()->json(['message' => 'Invalid verification code.'], 422);
        }

        $user->forceFill([
            'two_factor_confirmed_at' => now(),
            'two_factor_recovery_codes' => collect(range(1, 8))->map(fn () => Str::random(10))->all(),
        ])->save();

        return response()->json([
            'message' => 'Two-factor authentication enabled.',
            'recovery_codes' => $user->two_factor_recovery_codes,
        ]);
    }

    /**
     * Disable 2FA (requires current password).
     */
    public function disable(Request $request): JsonResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        $user->forceFill([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ])->save();

        return response()->json(['message' => 'Two-factor authentication disabled.']);
    }

    /**
     * Complete 2FA challenge during login. Accepts temporary token and returns full token.
     */
    public function challenge(Request $request): JsonResponse
    {
        $request->validate([
            'code' => ['required', 'string'],
        ]);

        $user = $request->user();

        if (!$user->hasTwoFactorEnabled()) {
            return response()->json(['message' => 'Two-factor is not enabled.'], 400);
        }

        $secret = decrypt($user->two_factor_secret);
        $google2fa = new Google2FA();

        $valid = $google2fa->verifyKey($secret, $request->code);

        if (!$valid) {
            $recoveryCodes = $user->two_factor_recovery_codes ?? [];
            if (in_array($request->code, $recoveryCodes)) {
                $valid = true;
                $user->forceFill([
                    'two_factor_recovery_codes' => array_values(array_diff($recoveryCodes, [$request->code])),
                ])->save();
            }
        }

        if (!$valid) {
            return response()->json(['message' => 'Invalid verification code.'], 422);
        }

        $request->user()->currentAccessToken()->delete();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user' => new UserResource($user->loadCount(['followers', 'following'])),
            'token' => $token,
        ]);
    }

    /**
     * Get 2FA status for the authenticated user.
     */
    public function status(Request $request): JsonResponse
    {
        return response()->json([
            'enabled' => $request->user()->hasTwoFactorEnabled(),
        ]);
    }
}
