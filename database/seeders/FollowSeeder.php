<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class FollowSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::all();

        foreach ($users as $user) {
            // Each user follows 5-15 random users
            $followingCount = rand(5, 15);
            $followingIds = $users->random($followingCount)
                ->pluck('id')
                ->reject(fn($id) => $id === $user->id)
                ->take($followingCount)
                ->toArray();

            $user->following()->sync($followingIds);
        }
    }
}
