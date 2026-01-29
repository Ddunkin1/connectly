<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\FollowController;
use App\Http\Controllers\Api\LikeController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public routes (with rate limiting)
Route::middleware('throttle:60,1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// Protected routes (with rate limiting)
Route::middleware(['auth:sanctum', 'throttle:120,1'])->group(function () {
    // Authentication
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // User Profile
    Route::get('/users/{user}/profile', [UserController::class, 'profile']);
    Route::get('/users/{user}/posts', [UserController::class, 'posts']);
    Route::put('/user/profile', [UserController::class, 'updateProfile']);
    Route::post('/user/profile-picture', [UserController::class, 'uploadProfilePicture']);

    // Posts
    Route::get('/posts', [PostController::class, 'index']); // Feed
    Route::post('/posts', [PostController::class, 'store']);
    Route::get('/posts/{post}', [PostController::class, 'show']);
    Route::put('/posts/{post}', [PostController::class, 'update']);
    Route::delete('/posts/{post}', [PostController::class, 'destroy']);

    // Post Likes
    Route::post('/posts/{post}/like', [LikeController::class, 'like']);
    Route::delete('/posts/{post}/unlike', [LikeController::class, 'unlike']);

    // Comments
    Route::get('/posts/{post}/comments', [CommentController::class, 'index']);
    Route::post('/posts/{post}/comments', [CommentController::class, 'store']);
    Route::delete('/comments/{comment}', [CommentController::class, 'destroy']);

    // Follow/Unfollow
    Route::post('/users/{user}/follow', [FollowController::class, 'follow']);
    Route::delete('/users/{user}/unfollow', [FollowController::class, 'unfollow']);

    // Search
    Route::get('/search', [SearchController::class, 'search']);

    // EdgeStore API Handler
    Route::any('/edgestore/{any}', [\App\Http\Controllers\Api\EdgeStoreController::class, 'handle'])
        ->where('any', '.*');
});
