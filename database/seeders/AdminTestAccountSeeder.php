<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Default admin test account for the admin portal.
 * Login at /admin/login with username or email below.
 */
class AdminTestAccountSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['username' => 'adminTest'],
            [
                'name' => 'Admin Test',
                'email' => 'admintest@connectly.local',
                'role' => User::ROLE_ADMIN,
                'password' => Hash::make('adminTest'),
                'bio' => 'Administrator',
                'privacy_settings' => 'public',
                'email_verified_at' => now(),
            ]
        );
    }
}
