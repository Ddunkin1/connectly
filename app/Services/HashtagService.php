<?php

namespace App\Services;

use App\Models\Hashtag;
use App\Models\Post;
use Illuminate\Support\Str;

class HashtagService
{
    /**
     * Extract hashtags from content and sync them with a post.
     */
    public function syncHashtags(Post $post, string $content): void
    {
        preg_match_all('/#(\w+)/', $content, $matches);

        if (empty($matches[1])) {
            $post->hashtags()->detach();
            return;
        }

        $hashtagIds = [];

        foreach ($matches[1] as $hashtagName) {
            $hashtag = Hashtag::firstOrCreate(
                ['name' => '#' . $hashtagName],
                ['slug' => Str::slug($hashtagName)]
            );

            $hashtagIds[] = $hashtag->id;
        }

        $post->hashtags()->sync($hashtagIds);
    }

    /**
     * Extract hashtags from content.
     *
     * @return array<string>
     */
    public function extractHashtags(string $content): array
    {
        preg_match_all('/#(\w+)/', $content, $matches);

        return $matches[1] ?? [];
    }
}
