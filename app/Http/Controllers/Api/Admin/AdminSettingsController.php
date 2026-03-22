<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AdminSettingsController extends Controller
{
    /**
     * Read-only system diagnostics (no secrets).
     */
    public function index(): JsonResponse
    {
        $dbOk = false;
        try {
            DB::connection()->getPdo();
            $dbOk = true;
        } catch (\Throwable) {
            $dbOk = false;
        }

        $supabaseUrl = config('services.supabase.url');
        $supabaseBucket = config('services.supabase.bucket');
        $serviceRoleSet = !empty(config('services.supabase.service_role_key'));

        return response()->json([
            'general' => [
                'app_name' => config('app.name'),
                'app_url' => config('app.url'),
                'app_env' => config('app.env'),
            ],
            'system' => [
                'php_version' => PHP_VERSION,
                'laravel_version' => app()->version(),
                'database_connected' => $dbOk,
            ],
            'infrastructure' => [
                'queue_default' => config('queue.default'),
                'cache_default' => config('cache.default'),
                'session_driver' => config('session.driver'),
                'mail_mailer' => config('mail.default'),
            ],
            'broadcasting' => [
                'default' => config('broadcasting.default'),
            ],
            'storage' => [
                'supabase_host' => $supabaseUrl ? parse_url((string) $supabaseUrl, PHP_URL_HOST) : null,
                'supabase_bucket' => $supabaseBucket,
                'supabase_service_role_configured' => $serviceRoleSet,
                'supabase_image_redirect_only' => (bool) config('services.supabase.image_redirect_only'),
            ],
            'oauth' => [
                'google_configured' => !empty(config('services.google.client_id')),
                'facebook_configured' => !empty(config('services.facebook.client_id')),
            ],
        ]);
    }
}
