<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SupabaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TestSupabaseController extends Controller
{
    /**
     * Test Supabase connection and configuration.
     * Development only - remove in production.
     *
     * @return JsonResponse
     */
    public function testConnection(): JsonResponse
    {
        try {
            $supabaseUrl = config('services.supabase.url');
            $supabaseKey = config('services.supabase.key');
            $bucket = config('services.supabase.bucket', 'public');

            // Check if config is loaded
            if (!$supabaseUrl || !$supabaseKey) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Supabase configuration is missing',
                    'config' => [
                        'url' => $supabaseUrl ? 'set' : 'missing',
                        'key' => $supabaseKey ? 'set' : 'missing',
                        'bucket' => $bucket,
                    ],
                ], 500);
            }

            // Test SupabaseService instantiation
            try {
                $service = app(SupabaseService::class);
                $serviceStatus = 'instantiated';
            } catch (\Exception $e) {
                $serviceStatus = 'failed: ' . $e->getMessage();
            }

            // Test API connection - try to list buckets or check bucket
            $connectionStatus = 'unknown';
            $bucketExists = false;
            $errorMessage = null;

            try {
                // Try to get bucket info
                $response = Http::withHeaders([
                    'apikey' => $supabaseKey,
                    'Authorization' => 'Bearer ' . $supabaseKey,
                ])->get("{$supabaseUrl}/storage/v1/bucket/{$bucket}");

                if ($response->successful()) {
                    $connectionStatus = 'connected';
                    $bucketExists = true;
                } else {
                    $connectionStatus = 'failed';
                    $errorMessage = $response->body();
                }
            } catch (\Exception $e) {
                $connectionStatus = 'error';
                $errorMessage = $e->getMessage();
                Log::error('Supabase connection test error: ' . $e->getMessage());
            }

            // Parse error message if it's JSON
            $parsedError = $errorMessage;
            if ($errorMessage && str_starts_with(trim($errorMessage), '{')) {
                try {
                    $parsedError = json_decode($errorMessage, true);
                } catch (\Exception $e) {
                    // Keep original if parsing fails
                }
            }

            // Try to auto-create bucket if it doesn't exist
            $autoCreated = false;
            if (!$bucketExists) {
                try {
                    $service = app(SupabaseService::class);
                    $autoCreated = $service->createBucket($bucket, true);
                    if ($autoCreated) {
                        // Re-check bucket existence
                        $recheckResponse = Http::withHeaders([
                            'apikey' => $supabaseKey,
                            'Authorization' => 'Bearer ' . $supabaseKey,
                        ])->get("{$supabaseUrl}/storage/v1/bucket/{$bucket}");
                        
                        if ($recheckResponse->successful()) {
                            $bucketExists = true;
                            $connectionStatus = 'connected';
                        }
                    }
                } catch (\Exception $e) {
                    Log::info('Auto-bucket creation failed (may need service_role key): ' . $e->getMessage());
                }
            }

            return response()->json([
                'status' => $connectionStatus === 'connected' ? 'success' : 'error',
                'message' => $connectionStatus === 'connected' 
                    ? 'Supabase connection successful' 
                    : ($autoCreated ? 'Bucket creation attempted - please verify' : 'Supabase connection failed - Bucket not found'),
                'details' => [
                    'supabase_url' => $supabaseUrl,
                    'bucket' => $bucket,
                    'service_status' => $serviceStatus,
                    'connection_status' => $connectionStatus,
                    'bucket_exists' => $bucketExists,
                    'auto_created' => $autoCreated,
                    'error' => $parsedError,
                ],
                'solution' => $bucketExists ? null : [
                    'action' => 'Create the bucket in Supabase dashboard',
                    'direct_link' => "https://app.supabase.com/project/" . str_replace(['https://', '.supabase.co'], '', $supabaseUrl) . "/storage/buckets",
                    'steps' => [
                        '1. Click this link: https://app.supabase.com/project/' . str_replace(['https://', '.supabase.co'], '', $supabaseUrl) . '/storage/buckets',
                        '2. Click "New bucket" button',
                        '3. Name: "public" (lowercase, exact)',
                        '4. Toggle "Public bucket" to ON ✅',
                        '5. Click "Create bucket"',
                        '6. Refresh this page to verify',
                    ],
                    'see_guide' => 'See CREATE_BUCKET_NOW.md for quick instructions',
                ],
            ], $connectionStatus === 'connected' ? 200 : 200); // Return 200 so JSON is visible, not 500

        } catch (\Exception $e) {
            Log::error('Supabase test error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Test failed: ' . $e->getMessage(),
            ], 500);
        }
    }
}
