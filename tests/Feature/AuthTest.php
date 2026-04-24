<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/register', [
            'name'                  => 'Test User',
            'email'                 => 'test@example.com',
            'username'              => 'testuser',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['message', 'user', 'token']);

        $this->assertDatabaseHas('users', ['email' => 'test@example.com']);
    }

    public function test_register_fails_with_duplicate_email(): void
    {
        User::factory()->create(['email' => 'existing@example.com']);

        $this->postJson('/api/register', [
            'name'                  => 'Another User',
            'email'                 => 'existing@example.com',
            'username'              => 'anotheruser',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ])->assertStatus(422);
    }

    public function test_user_can_login_with_email(): void
    {
        $user = User::factory()->create([
            'email'    => 'login@example.com',
            'password' => bcrypt('password123'),
        ]);

        $this->postJson('/api/login', [
            'email'    => 'login@example.com',
            'password' => 'password123',
        ])->assertOk()
          ->assertJsonStructure(['token', 'user']);
    }

    public function test_user_can_login_with_username(): void
    {
        $user = User::factory()->create([
            'username' => 'myuser',
            'password' => bcrypt('password123'),
        ]);

        $this->postJson('/api/login', [
            'email'    => 'myuser',
            'password' => 'password123',
        ])->assertOk()
          ->assertJsonPath('user.username', 'myuser');
    }

    public function test_login_fails_with_wrong_password(): void
    {
        User::factory()->create([
            'email'    => 'bad@example.com',
            'password' => bcrypt('correctpassword'),
        ]);

        $this->postJson('/api/login', [
            'email'    => 'bad@example.com',
            'password' => 'wrongpassword',
        ])->assertStatus(422);
    }

    public function test_authenticated_user_can_logout(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $this->withToken($token)
            ->postJson('/api/logout')
            ->assertOk()
            ->assertJson(['message' => 'Logged out successfully']);
    }

    public function test_get_authenticated_user(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('user.id', $user->id);
    }

    public function test_unauthenticated_request_returns_401(): void
    {
        $this->getJson('/api/user')->assertStatus(401);
    }

    public function test_email_verification_link_marks_user_verified(): void
    {
        $user = User::factory()->unverified()->create();

        $verifyUrl = URL::temporarySignedRoute(
            'api.verification.verify',
            now()->addHour(),
            ['id' => $user->id, 'hash' => sha1($user->email)]
        );

        $this->get($verifyUrl)->assertRedirect();

        $this->assertNotNull($user->fresh()->email_verified_at);
    }
}
