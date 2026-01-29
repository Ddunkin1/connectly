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

    public function __construct()
    {
        $this->supabaseUrl = config('services.supabase.url');
        $this->supabaseKey = config('services.supabase.key');
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

            // If bucket doesn't exist, provide helpful error
            if ($response->status() === 404) {
                Log::error('Supabase bucket not found. Please create the bucket in Supabase dashboard.', [
                    'bucket' => $this->bucket,
                    'supabase_url' => $this->supabaseUrl,
                ]);
            }

            return null;
        } catch (\Exception $e) {
            Log::error('Supabase upload error: ' . $e->getMessage());
            return null;
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
