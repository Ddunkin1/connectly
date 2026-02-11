<?php

namespace Database\Seeders;

use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Seeder;

class CommentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $posts = Post::all();
        $users = User::all();

        foreach ($posts as $post) {
            // Each post gets 0-5 comments
            $commentCount = rand(0, 5);

            for ($i = 0; $i < $commentCount; $i++) {
                $comment = Comment::create([
                    'post_id' => $post->id,
                    'user_id' => $users->random()->id,
                    'content' => $this->generateCommentContent(),
                ]);

                // 30% chance of having a reply
                if (rand(1, 100) <= 30 && $commentCount > 1) {
                    Comment::create([
                        'post_id' => $post->id,
                        'user_id' => $users->random()->id,
                        'parent_comment_id' => $comment->id,
                        'content' => $this->generateCommentContent(),
                    ]);
                }
            }
        }
    }

    /**
     * Generate random comment content.
     */
    private function generateCommentContent(): string
    {
        $contents = [
            'Great post!',
            'I totally agree!',
            'Thanks for sharing!',
            'This is amazing!',
            'Love this!',
            'Well said!',
            'Interesting perspective!',
            'Keep it up!',
            'Awesome!',
            'Nice one!',
        ];

        return $contents[array_rand($contents)];
    }
}
