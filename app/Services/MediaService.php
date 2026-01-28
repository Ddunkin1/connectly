<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaService
{
    /**
     * Store uploaded profile picture.
     */
    public function storeProfilePicture(UploadedFile $file, int $userId): string
    {
        $filename = 'profile_' . $userId . '_' . time() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('profile-pictures', $filename, 'public');

        return $path;
    }

    /**
     * Delete profile picture.
     */
    public function deleteProfilePicture(?string $path): bool
    {
        if (!$path) {
            return false;
        }

        return Storage::disk('public')->delete($path);
    }

    /**
     * Store uploaded post media.
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
     * Delete post media.
     */
    public function deletePostMedia(?string $path): bool
    {
        if (!$path) {
            return false;
        }

        return Storage::disk('public')->delete($path);
    }
}
