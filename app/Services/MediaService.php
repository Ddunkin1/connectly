<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Http;

class MediaService
{
    /**
     * Store uploaded profile picture.
     * 
     * NOTE: This method is deprecated. Profile pictures are now uploaded via Supabase
     * and URLs are saved directly. Kept for backward compatibility.
     * 
     * @deprecated Use SupabaseService for uploads
     */
    public function storeProfilePicture(UploadedFile $file, int $userId): string
    {
        $filename = 'profile_' . $userId . '_' . time() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('profile-pictures', $filename, 'public');

        return $path;
    }

    /**
     * Delete profile picture from Supabase.
     * 
     * If the path is a Supabase URL, delete it via Supabase API.
     * Otherwise, delete from local storage (for backward compatibility).
     */
    public function deleteProfilePicture(?string $path): bool
    {
        if (!$path) {
            return false;
        }

        // Check if it's a Supabase URL
        if (filter_var($path, FILTER_VALIDATE_URL) && str_contains($path, 'supabase')) {
            // Use SupabaseService to delete file
            $supabaseService = app(\App\Services\SupabaseService::class);
            return $supabaseService->deleteFile($path);
        }

        // Delete from local storage (backward compatibility)
        return Storage::disk('public')->delete($path);
    }

    /**
     * Store uploaded post media.
     * 
     * NOTE: This method is deprecated. Post media is now uploaded via EdgeStore
     * and URLs are saved directly. Kept for backward compatibility.
     * 
     * @deprecated Use EdgeStore React components for uploads
     */
    public function storePostMedia(UploadedFile $file, int $postId): string
    {
        $extension = $file->getClientOriginalExtension();
        $mediaType = in_array(strtolower($extension), ['jpg', 'jpeg', 'png', 'gif', 'webp']) ? 'image' : 'video';
        $filename = 'post_' . $postId . '_' . time() . '.' . $extension;
        $path = $file->storeAs('post-media/' . $mediaType, $filename, 'public');

        return $path;
    }

    /**
     * Delete post media from Supabase.
     * 
     * If the path is a Supabase URL, delete it via Supabase API.
     * Otherwise, delete from local storage (for backward compatibility).
     */
    public function deletePostMedia(?string $path): bool
    {
        if (!$path) {
            return false;
        }

        // Check if it's a Supabase URL
        if (filter_var($path, FILTER_VALIDATE_URL) && str_contains($path, 'supabase')) {
            // Use SupabaseService to delete file
            $supabaseService = app(\App\Services\SupabaseService::class);
            return $supabaseService->deleteFile($path);
        }

        // Delete from local storage (backward compatibility)
        return Storage::disk('public')->delete($path);
    }
}
