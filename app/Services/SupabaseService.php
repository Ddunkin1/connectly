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

    public function __construct()
    {
        $this->supabaseUrl = config('services.supabase.url');
        $this->supabaseKey = config('services.supabase.key');
        $this->serviceRoleKey = config('services.supabase.service_role_key');
        $this->bucket = config('services.supabase.bucket', 'public');
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

            // Read file contents
            $fileContents = file_get_contents($file->getRealPath());

            // Upload to Supabase Storage
            $response = Http::withHeaders([
                'apikey' => $this->supabaseKey,
                'Authorization' => 'Bearer ' . $this->supabaseKey,
                'Content-Type' => $file->getMimeType(),
            ])->put(
                "{$this->supabaseUrl}/storage/v1/object/{$this->bucket}/{$path}",
                $fileContents
            );

            if ($response->successful()) {
                // Return public URL
                return "{$this->supabaseUrl}/storage/v1/object/public/{$this->bucket}/{$path}";
            }

            Log::error('Supabase upload failed', [
                'status' => $response->status(),
                'body' => $response->body(),
                'url' => "{$this->supabaseUrl}/storage/v1/object/{$this->bucket}/{$path}",
                'bucket' => $this->bucket,
            ]);

            // If bucket doesn't exist, try to create it automatically
            if ($response->status() === 404) {
                Log::warning('Supabase bucket not found. Attempting to create...', [
                    'bucket' => $this->bucket,
                    'supabase_url' => $this->supabaseUrl,
                ]);
                
                // Try to auto-create the bucket
                if ($this->createBucket($this->bucket, true)) {
                    // Retry upload after bucket creation
                    $retryResponse = Http::withHeaders([
                        'apikey' => $this->supabaseKey,
                        'Authorization' => 'Bearer ' . $this->supabaseKey,
                        'Content-Type' => $file->getMimeType(),
                    ])->put(
                        "{$this->supabaseUrl}/storage/v1/object/{$this->bucket}/{$path}",
                        $fileContents
                    );
                    
                    if ($retryResponse->successful()) {
                        return "{$this->supabaseUrl}/storage/v1/object/public/{$this->bucket}/{$path}";
                    }
                }
                
                Log::error('Supabase bucket not found and auto-creation failed. Please create the bucket manually in Supabase dashboard.', [
                    'bucket' => $this->bucket,
                    'supabase_url' => $this->supabaseUrl,
                    'dashboard_link' => 'https://app.supabase.com/project/' . str_replace(['https://', '.supabase.co'], '', $this->supabaseUrl) . '/storage/buckets',
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
                'apikey' => $this->supabaseKey,
                'Authorization' => 'Bearer ' . $this->supabaseKey,
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
