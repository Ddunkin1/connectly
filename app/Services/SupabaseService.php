<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SupabaseService
{
    private string $supabaseUrl;
    private string $supabaseKey;
    private string $bucket;

    private ?string $serviceRoleKey = null;
    private string $activeKey; // The key to use for operations

    public function __construct()
    {
        $this->supabaseUrl = config('services.supabase.url');
        $this->supabaseKey = config('services.supabase.key');
        $this->serviceRoleKey = config('services.supabase.service_role_key');
        $this->bucket = config('services.supabase.bucket', 'publicConnectly');
        
        // Use service_role key if available (bypasses RLS), otherwise fall back to anon key
        // Check if service_role_key is set and not empty
        $this->activeKey = (!empty($this->serviceRoleKey)) ? $this->serviceRoleKey : $this->supabaseKey;
        
        // Log which key is being used (for debugging)
        if (config('app.debug')) {
            \Log::debug('SupabaseService initialized', [
                'bucket' => $this->bucket,
                'using_key_type' => (!empty($this->serviceRoleKey)) ? 'service_role' : 'anon',
                'has_service_role_key' => !empty($this->serviceRoleKey),
            ]);
        }
    }

    /**
     * Upload a file to Supabase Storage.
     *
     * @param UploadedFile $file
     * @param string $folder
     * @return string|null The public URL of the uploaded file
     */
    public function uploadFile(UploadedFile $file, string $folder = 'uploads'): ?string
    {
        try {
            $fileName = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $path = $folder . '/' . $fileName;

            // Read file contents as binary
            $fileContents = file_get_contents($file->getRealPath());

            // Upload to Supabase Storage
            // Use service_role key if available (bypasses RLS), otherwise use anon key
            // Use withBody() to send raw binary data instead of JSON encoding
            $response = Http::withHeaders([
                'apikey' => $this->activeKey,
                'Authorization' => 'Bearer ' . $this->activeKey,
                'Content-Type' => $file->getMimeType(),
            ])->withBody($fileContents, $file->getMimeType())
              ->put("{$this->supabaseUrl}/storage/v1/object/{$this->bucket}/{$path}");

            if ($response->successful()) {
                // Return public URL
                return "{$this->supabaseUrl}/storage/v1/object/public/{$this->bucket}/{$path}";
            }

            $errorBody = $response->body();
            $errorData = null;
            try {
                $errorData = json_decode($errorBody, true);
            } catch (\Exception $e) {
                // Keep as string if not JSON
            }

            Log::error('Supabase upload failed', [
                'status' => $response->status(),
                'body' => $errorBody,
                'error_data' => $errorData,
                'url' => "{$this->supabaseUrl}/storage/v1/object/{$this->bucket}/{$path}",
                'bucket' => $this->bucket,
                'using_key_type' => $this->serviceRoleKey ? 'service_role' : 'anon',
                'file_size' => strlen($fileContents),
                'file_name' => $fileName,
            ]);

            // Handle different error statuses
            if ($response->status() === 404) {
                $errorMsg = 'Bucket "' . $this->bucket . '" not found in Supabase. ';
                $errorMsg .= 'Please verify the bucket exists at: https://app.supabase.com/project/' . str_replace(['https://', '.supabase.co'], '', $this->supabaseUrl) . '/storage/buckets';
                Log::error($errorMsg, [
                    'bucket' => $this->bucket,
                    'supabase_url' => $this->supabaseUrl,
                    'using_key_type' => $this->serviceRoleKey ? 'service_role' : 'anon',
                ]);
            } elseif ($response->status() === 401 || $response->status() === 403) {
                $errorMsg = 'Supabase authentication failed. ';
                $errorMsg .= $this->serviceRoleKey ? 'Service role key may be invalid.' : 'Anon key may not have permissions. Consider using SUPABASE_SERVICE_ROLE_KEY.';
                Log::error($errorMsg, [
                    'status' => $response->status(),
                    'using_key_type' => $this->serviceRoleKey ? 'service_role' : 'anon',
                ]);
            } else {
                Log::error('Supabase upload failed with status ' . $response->status(), [
                    'status' => $response->status(),
                    'error_body' => $errorBody,
                ]);
            }

            return null;
        } catch (\Exception $e) {
            Log::error('Supabase upload error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Create a bucket in Supabase Storage (requires service_role key).
     *
     * @param string $bucketName
     * @param bool $public
     * @param string|null $serviceRoleKey Optional service_role key (if different from configured key)
     * @return bool
     */
    public function createBucket(string $bucketName, bool $public = true, ?string $serviceRoleKey = null): bool
    {
        try {
            $key = $serviceRoleKey ?? $this->serviceRoleKey ?? $this->supabaseKey;
            
            $response = Http::withHeaders([
                'apikey' => $key,
                'Authorization' => 'Bearer ' . $key,
                'Content-Type' => 'application/json',
            ])->post(
                "{$this->supabaseUrl}/storage/v1/bucket",
                [
                    'name' => $bucketName,
                    'public' => $public,
                ]
            );

            if ($response->successful()) {
                Log::info("Supabase bucket '{$bucketName}' created successfully");
                return true;
            }

            // If bucket already exists, that's okay
            if ($response->status() === 409) {
                Log::info("Supabase bucket '{$bucketName}' already exists");
                return true;
            }

            Log::error('Supabase bucket creation failed', [
                'status' => $response->status(),
                'body' => $response->body(),
                'bucket' => $bucketName,
            ]);

            return false;
        } catch (\Exception $e) {
            Log::error('Supabase bucket creation error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Delete a file from Supabase Storage.
     *
     * @param string $filePath
     * @return bool
     */
    public function deleteFile(string $filePath): bool
    {
        try {
            // Extract path from URL if full URL is provided
            $path = $filePath;
            if (str_contains($filePath, '/storage/v1/object/public/')) {
                $path = str_replace("{$this->supabaseUrl}/storage/v1/object/public/{$this->bucket}/", '', $filePath);
            }

            $response = Http::withHeaders([
                'apikey' => $this->activeKey,
                'Authorization' => 'Bearer ' . $this->activeKey,
            ])->delete(
                "{$this->supabaseUrl}/storage/v1/object/{$this->bucket}/{$path}"
            );

            return $response->successful();
        } catch (\Exception $e) {
            Log::error('Supabase delete error: ' . $e->getMessage());
            return false;
        }
    }
}
