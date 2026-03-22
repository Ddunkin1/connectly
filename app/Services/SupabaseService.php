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
            // Longer timeouts to avoid cURL 28 (SSL/connection timeout) on slow or distant networks
            $response = Http::connectTimeout(60)
                ->timeout(180)
                ->withHeaders([
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
                'using_key_type' => (!empty($this->serviceRoleKey)) ? 'service_role' : 'anon',
                'file_size' => strlen($fileContents),
                'file_name' => $fileName,
            ]);

            $errorMsg = null;
            if ($response->status() === 404) {
                $errorMsg = "Bucket \"{$this->bucket}\" not found. Create it in Supabase Dashboard: Storage → New bucket → name it \"{$this->bucket}\" and set it as public.";
            } elseif ($response->status() === 401 || $response->status() === 403) {
                if (empty($this->serviceRoleKey)) {
                    $errorMsg = 'SUPABASE_SERVICE_ROLE_KEY is missing in .env. Add it from Supabase Dashboard → Project Settings → API (service_role key).';
                } else {
                    $errorMsg = 'Invalid SUPABASE_SERVICE_ROLE_KEY. Copy the service_role key from Supabase Dashboard → Project Settings → API.';
                }
            } else {
                $msg = $errorData['message'] ?? $errorData['error'] ?? $errorBody;
                $errorMsg = "Supabase upload failed ({$response->status()}): " . (is_string($msg) ? $msg : json_encode($msg));
            }

            throw new \RuntimeException($errorMsg);
        } catch (\RuntimeException $e) {
            throw $e;
        } catch (\Exception $e) {
            Log::error('Supabase upload error: ' . $e->getMessage());
            throw new \RuntimeException('Supabase upload failed: ' . $e->getMessage());
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
            
            $response = Http::connectTimeout(30)->timeout(60)->withHeaders([
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
     * Fetch file contents from Supabase Storage (uses service role to bypass RLS).
     * Use this when the public URL returns 403 (e.g. bucket not public).
     *
     * @param string $publicUrl The stored public URL (e.g. .../object/public/bucket/path)
     * @return \Illuminate\Http\Client\Response|null Response or null on failure
     */
    public function fetchFile(string $publicUrl): ?\Illuminate\Http\Client\Response
    {
        $key = $this->serviceRoleKey ?: $this->supabaseKey;
        if (empty($key)) {
            return null;
        }

        // Convert to authenticated object URL (works for both public and signed Supabase URLs)
        // .../storage/v1/object/public/bucket/path -> .../storage/v1/object/bucket/path
        // .../storage/v1/object/sign/bucket/path?token=xxx -> .../storage/v1/object/bucket/path
        $objectUrl = str_replace('/object/public/', '/object/', $publicUrl);
        $objectUrl = preg_replace('#/object/sign/([^?]+)(\?.*)?$#', '/object/$1', $objectUrl);
        if ($objectUrl === $publicUrl && !str_contains($publicUrl, '/object/')) {
            return null; // Not a recognized Supabase storage URL
        }

        try {
            $response = Http::connectTimeout(30)
                ->timeout(60)
                ->withHeaders([
                    'apikey' => $key,
                    'Authorization' => 'Bearer ' . $key,
                ])
                ->get($objectUrl);

            if (!$response->successful()) {
                Log::warning('Supabase fetchFile non-2xx response', [
                    'url' => $objectUrl,
                    'status' => $response->status(),
                    'body' => substr($response->body(), 0, 200),
                ]);
                return null;
            }
            return $response;
        } catch (\Exception $e) {
            Log::error('Supabase fetch file error: ' . $e->getMessage(), ['url' => $objectUrl]);
            return null;
        }
    }

    /**
     * Fetch storage file: try authenticated API first, then direct GET on the public URL.
     * Use this for image proxies so public buckets still work if keys are missing or auth fails.
     */
    public function fetchFileWithFallback(string $publicUrl): ?\Illuminate\Http\Client\Response
    {
        if (!str_contains($publicUrl, 'supabase.co') || !str_contains($publicUrl, '/object/')) {
            return null;
        }

        $authenticated = $this->fetchFile($publicUrl);
        if ($authenticated && $authenticated->successful()) {
            return $authenticated;
        }

        try {
            $publicResponse = Http::connectTimeout(20)
                ->timeout(60)
                ->get($publicUrl);

            if ($publicResponse->successful()) {
                return $publicResponse;
            }

            Log::warning('Supabase public URL fallback non-2xx', [
                'url' => substr($publicUrl, 0, 160),
                'status' => $publicResponse->status(),
            ]);
        } catch (\Exception $e) {
            Log::warning('Supabase public URL fallback failed', [
                'message' => $e->getMessage(),
                'url' => substr($publicUrl, 0, 160),
            ]);
        }

        return null;
    }

    /**
     * Build the public URL for an object path (path relative to bucket, no leading slash).
     */
    public function getPublicUrl(string $path): string
    {
        $path = ltrim($path, '/');
        return "{$this->supabaseUrl}/storage/v1/object/public/{$this->bucket}/{$path}";
    }

    /**
     * List object names under a prefix in the bucket.
     * Prefix should not have leading slash (e.g. "profile-pictures/profile-pictures-storage/123").
     *
     * @param string $prefix Folder prefix (no leading slash)
     * @param int $limit Max number of objects to return
     * @return array<int, string> Array of full object paths (prefix/name) for each file
     */
    public function listObjects(string $prefix, int $limit = 500): array
    {
        $prefix = ltrim($prefix, '/');
        if ($prefix !== '' && !str_ends_with($prefix, '/')) {
            $prefix .= '/';
        }

        try {
            $response = Http::connectTimeout(30)
                ->timeout(60)
                ->withHeaders([
                    'apikey' => $this->activeKey,
                    'Authorization' => 'Bearer ' . $this->activeKey,
                    'Content-Type' => 'application/json',
                ])
                ->post("{$this->supabaseUrl}/storage/v1/object/list/{$this->bucket}", [
                    'prefix' => $prefix,
                    'limit' => $limit,
                ]);

            if (!$response->successful()) {
                Log::warning('Supabase listObjects non-2xx', [
                    'prefix' => $prefix,
                    'status' => $response->status(),
                    'body' => substr($response->body(), 0, 300),
                ]);
                return [];
            }

            $data = $response->json();
            if (!is_array($data)) {
                return [];
            }

            $paths = [];
            foreach ($data as $item) {
                $name = $item['name'] ?? null;
                if ($name === null || $name === '') {
                    continue;
                }
                // Exclude folder placeholders (Supabase may return empty names or metadata)
                if (str_contains($name, '/')) {
                    continue; // subfolder, skip or could recurse later
                }
                $paths[] = $prefix . $name;
            }
            return $paths;
        } catch (\Exception $e) {
            Log::error('Supabase listObjects error: ' . $e->getMessage(), ['prefix' => $prefix]);
            return [];
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

            $response = Http::connectTimeout(30)->timeout(60)->withHeaders([
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
