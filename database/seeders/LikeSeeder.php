<?php

namespace Database\Seeders;

use App\Models\Like;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Seeder;

class LikeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $posts = Post::all();
        $users = User::all();

        foreach ($posts as $post) {
            // Each post gets 0-20 likes from random users
            $likeCount = rand(0, 20);
            $likingUsers = $users->random(min($likeCount, $users->count()));

            foreach ($likingUsers as $user) {
                // Skip if user already liked (shouldn't happen but just in case)
                if (!$post->isLikedBy($user)) {
                    Like::create([
                        'user_id' => $user->id,
                        'likeable_id' => $post->id,
                        'likeable_type' => Post::class,
                    ]);
                }
            }
        }
    }
}
