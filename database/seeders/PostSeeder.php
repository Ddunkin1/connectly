<?php

namespace Database\Seeders;

use App\Models\Post;
use App\Models\User;
use App\Services\HashtagService;
use Illuminate\Database\Seeder;

class PostSeeder extends Seeder
{
    public function __construct(
        private HashtagService $hashtagService
    ) {
    }

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::all();

        foreach ($users as $user) {
            // Each user creates 3-10 posts
            $postCount = rand(3, 10);

            for ($i = 0; $i < $postCount; $i++) {
                $content = $this->generatePostContent();
                $post = Post::create([
                    'user_id' => $user->id,
                    'content' => $content,
                    'media_url' => rand(0, 1) ? 'https://picsum.photos/800/600?random=' . rand(1, 1000) : null,
                    'media_type' => rand(0, 1) ? 'image' : null,
                    'visibility' => rand(0, 1) ? 'public' : 'followers',
                ]);

                // Sync hashtags
                $this->hashtagService->syncHashtags($post, $content);
            }
        }
    }

    /**
     * Generate random post content with hashtags.
     */
    private function generatePostContent(): string
    {
        $contents = [
            'Just had an amazing day! #blessed #grateful',
            'Working on something exciting! Stay tuned. #coding #development',
            'Beautiful sunset today! #nature #photography',
            'New project launched! Check it out. #startup #innovation',
            'Coffee and code, perfect combination! #developer #coding',
            'Weekend vibes! #relax #weekend',
            'Learning something new every day! #growth #mindset',
            'Team meeting went great! #teamwork #collaboration',
            'Can\'t wait for the weekend! #friday #weekend',
            'Sharing some thoughts on technology. #tech #innovation',
        ];

        return $contents[array_rand($contents)];
    }
}
