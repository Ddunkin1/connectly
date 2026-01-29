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
            $serviceRoleKey = config('services.supabase.service_role_key');
            $bucket = config('services.supabase.bucket', 'publicConnectly');
            
            // Use service_role key if available for testing (bypasses RLS)
            $testKey = $serviceRoleKey ?? $supabaseKey;

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

            // Test API connection - try to list buckets (works better with anon key)
            $connectionStatus = 'unknown';
            $bucketExists = false;
            $errorMessage = null;

            try {
                // Try to list all buckets - use service_role key if available
                $response = Http::withHeaders([
                    'apikey' => $testKey,
                    'Authorization' => 'Bearer ' . $testKey,
                ])->get("{$supabaseUrl}/storage/v1/bucket");

                if ($response->successful()) {
                    $buckets = $response->json();
                    // Check if our bucket exists in the list
                    if (is_array($buckets)) {
                        foreach ($buckets as $b) {
                            if (isset($b['name']) && $b['name'] === $bucket) {
                                $bucketExists = true;
                                $connectionStatus = 'connected';
                                break;
                            }
                        }
                    }
                    
                    // If bucket not found in list, try direct test upload
                    if (!$bucketExists) {
                        // Try to upload a tiny test file to verify bucket exists and is writable
                        $testContent = 'test';
                        $testResponse = Http::withHeaders([
                            'apikey' => $testKey,
                            'Authorization' => 'Bearer ' . $testKey,
                            'Content-Type' => 'text/plain',
                        ])->put(
                            "{$supabaseUrl}/storage/v1/object/{$bucket}/.test-connection",
                            $testContent
                        );
                        
                        if ($testResponse->successful() || $testResponse->status() === 200) {
                            $bucketExists = true;
                            $connectionStatus = 'connected';
                            // Clean up test file
                            Http::withHeaders([
                                'apikey' => $testKey,
                                'Authorization' => 'Bearer ' . $testKey,
                            ])->delete("{$supabaseUrl}/storage/v1/object/{$bucket}/.test-connection");
                        } else {
                            $connectionStatus = 'failed';
                            $errorMessage = $testResponse->body();
                        }
                    }
                } else {
                    // If list buckets fails, try direct upload test
                    $testContent = 'test';
                    $testResponse = Http::withHeaders([
                        'apikey' => $testKey,
                        'Authorization' => 'Bearer ' . $testKey,
                        'Content-Type' => 'text/plain',
                    ])->put(
                        "{$supabaseUrl}/storage/v1/object/{$bucket}/.test-connection",
                        $testContent
                    );
                    
                    if ($testResponse->successful() || $testResponse->status() === 200) {
                        $bucketExists = true;
                        $connectionStatus = 'connected';
                        // Clean up test file
                        Http::withHeaders([
                            'apikey' => $testKey,
                            'Authorization' => 'Bearer ' . $testKey,
                        ])->delete("{$supabaseUrl}/storage/v1/object/{$bucket}/.test-connection");
                    } else {
                        $connectionStatus = 'failed';
                        $errorMessage = $testResponse->body();
                    }
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
                            'apikey' => $testKey,
                            'Authorization' => 'Bearer ' . $testKey,
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
                        '2. Verify bucket "' . $bucket . '" exists and is PUBLIC',
                        '3. If bucket doesn\'t exist, click "New bucket"',
                        '4. Name: "' . $bucket . '" (exact match)',
                        '5. Toggle "Public bucket" to ON ✅',
                        '6. Go to Storage → Policies and ensure bucket has INSERT/SELECT policies',
                        '7. Refresh this page to verify',
                    ],
                    'note' => 'For Laravel backend, use SERVICE_ROLE_KEY (not anon key). Get it from: https://app.supabase.com/project/' . str_replace(['https://', '.supabase.co'], '', $supabaseUrl) . '/settings/api',
                    'service_role_key_set' => $serviceRoleKey ? 'yes' : 'no',
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

    /**
     * Test Supabase file upload directly.
     * Development only - remove in production.
     *
     * @return JsonResponse
     */
    public function testUpload(): JsonResponse
    {
        try {
            $supabaseUrl = config('services.supabase.url');
            $serviceRoleKey = config('services.supabase.service_role_key');
            $anonKey = config('services.supabase.key');
            $bucket = config('services.supabase.bucket', 'publicConnectly');
            
            $testKey = $serviceRoleKey ?? $anonKey;
            
            // Create a small test file
            $testContent = 'test upload ' . time();
            $testPath = 'test/.test-' . time() . '.txt';
            
            $response = Http::withHeaders([
                'apikey' => $testKey,
                'Authorization' => 'Bearer ' . $testKey,
                'Content-Type' => 'text/plain',
            ])->put(
                "{$supabaseUrl}/storage/v1/object/{$bucket}/{$testPath}",
                $testContent
            );
            
            $success = $response->successful();
            $status = $response->status();
            $body = $response->body();
            
            // Try to delete the test file if upload succeeded
            if ($success) {
                Http::withHeaders([
                    'apikey' => $testKey,
                    'Authorization' => 'Bearer ' . $testKey,
                ])->delete("{$supabaseUrl}/storage/v1/object/{$bucket}/{$testPath}");
            }
            
            return response()->json([
                'status' => $success ? 'success' : 'error',
                'message' => $success ? 'Upload test successful' : 'Upload test failed',
                'details' => [
                    'bucket' => $bucket,
                    'http_status' => $status,
                    'response_body' => $body,
                    'using_key_type' => $serviceRoleKey ? 'service_role' : 'anon',
                    'test_path' => $testPath,
                ],
            ], $success ? 200 : 200);
            
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Upload test exception: ' . $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ], 500);
        }
    }
}
