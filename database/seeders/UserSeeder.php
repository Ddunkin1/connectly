<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create or update admin user (idempotent)
        User::updateOrCreate(
            ['email' => 'admin@connectly.com'],
            [
                'name' => 'Admin User',
                'username' => 'admin',
                'role' => User::ROLE_ADMIN,
                'password' => Hash::make('password'),
                'bio' => 'Administrator of Connectly',
                'privacy_settings' => 'public',
                'email_verified_at' => now(),
            ]
        );

        // Create test users (only if they don't exist)
        // Check how many users exist, and only create if less than 20
        $existingUserCount = User::where('email', '!=', 'admin@connectly.com')->count();
        $usersToCreate = max(0, 20 - $existingUserCount);
        
        if ($usersToCreate > 0) {
            User::factory($usersToCreate)->create();
        }
    }
}
