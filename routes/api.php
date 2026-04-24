<?php

use App\Http\Controllers\Api\AnalyticsController;
use Illuminate\Broadcasting\BroadcastController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BlockController;
use App\Http\Controllers\Api\BookmarkController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\CommunityController;
use App\Http\Controllers\Api\ConversationController;
use App\Http\Controllers\Api\FollowController;
use App\Http\Controllers\Api\GroupConversationController;
use App\Http\Controllers\Api\GroupMessageController;
use App\Http\Controllers\Api\FriendRequestController;
use App\Http\Controllers\Api\LikeController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\PollVoteController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\ProfileCommentController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\StoryController;
use App\Http\Controllers\Api\SocialAuthController;
use App\Http\Controllers\Api\TrendingController;
use App\Http\Controllers\Api\TwoFactorController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\BanAppealController;
use App\Http\Controllers\Api\WarningAppealController;
use App\Http\Controllers\Api\WarningEventController;
use App\Http\Controllers\Api\Admin\AdminWarningAppealController;
use App\Http\Controllers\Api\Admin\AdminBanAppealController;
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

// OAuth routes (no auth required)
Route::get('/auth/google', [SocialAuthController::class, 'redirectToGoogle']);
Route::get('/auth/google/callback', [SocialAuthController::class, 'handleGoogleCallback']);

// Public routes (with rate limiting)
Route::middleware('throttle:60,1')->group(function () {
    Route::get('/users/{user}/cover-image', [UserController::class, 'coverImage']);
    Route::get('/users/{user}/profile-picture', [UserController::class, 'profilePicture']);
    Route::post('/ban-appeals', [BanAppealController::class, 'store']);
    Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
        ->middleware('signed')
        ->name('api.verification.verify');
});

// Auth routes (stricter rate limiting - 5 per minute)
Route::middleware('throttle:5,1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
});

// Broadcast auth (Bearer token, no CSRF) - must be in API for SPA
Route::post('/broadcasting/auth', [BroadcastController::class, 'authenticate'])
    ->middleware(['auth:sanctum']);

// Protected routes (with rate limiting)
Route::middleware(['auth:sanctum', 'throttle:120,1'])->group(function () {
    // Authentication
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/email/verification-notification', [AuthController::class, 'resendVerification']);

    // Two-factor authentication
    Route::get('/two-factor/status', [TwoFactorController::class, 'status']);
    Route::post('/two-factor/setup', [TwoFactorController::class, 'setup']);
    Route::post('/two-factor/confirm', [TwoFactorController::class, 'confirm']);
    Route::post('/two-factor/disable', [TwoFactorController::class, 'disable']);
    Route::post('/two-factor/challenge', [TwoFactorController::class, 'challenge']);

    // User Profile
    Route::get('/users/{user}/profile', [UserController::class, 'profile']);
    Route::get('/users/{user}/posts', [UserController::class, 'posts']);
    Route::get('/users/{user}/communities', [UserController::class, 'communities']);
    Route::get('/user/connections', [UserController::class, 'connections']);
    Route::match(['put', 'post'], '/user/profile', [UserController::class, 'updateProfile']);
    Route::post('/user/profile-picture', [UserController::class, 'uploadProfilePicture']);
    Route::get('/user/profile-picture-history', [UserController::class, 'profilePictureHistory']);
    Route::get('/user/cover-image-history', [UserController::class, 'coverImageHistory']);
    Route::get('/user/storage-image', [UserController::class, 'storageImage']);
    Route::get('/users/suggested', [UserController::class, 'suggested']);
    Route::get('/user/notification-preferences', [UserController::class, 'notificationPreferences']);
    Route::put('/user/notification-preferences', [UserController::class, 'updateNotificationPreferences']);
    Route::get('/user/analytics', [AnalyticsController::class, 'index']);
    Route::get('/user/export-data', [UserController::class, 'exportData']);
    Route::post('/user/onboarding-complete', [UserController::class, 'completeOnboarding']);
    Route::delete('/user/account', [UserController::class, 'deleteAccount']);

    // Posts
    Route::get('/posts', [PostController::class, 'index']); // Feed
    Route::get('/posts/suggested', [PostController::class, 'suggested']);
    Route::post('/posts', [PostController::class, 'store']);
    Route::get('/posts/{post}', [PostController::class, 'show']);
    Route::put('/posts/{post}', [PostController::class, 'update']);
    Route::delete('/posts/{post}', [PostController::class, 'destroy']);

    // Post Likes
    Route::post('/posts/{post}/like', [LikeController::class, 'like']);
    Route::delete('/posts/{post}/unlike', [LikeController::class, 'unlike']);
    Route::post('/comments/{comment}/like', [LikeController::class, 'likeComment']);
    Route::delete('/comments/{comment}/unlike', [LikeController::class, 'unlikeComment']);

    // Post Share (increment share count)
    Route::post('/posts/{post}/share', [PostController::class, 'share']);

    // Poll vote
    Route::post('/posts/{post}/polls/vote', [PollVoteController::class, 'vote']);

    // Stories
    Route::get('/stories', [StoryController::class, 'index']);
    Route::post('/stories', [StoryController::class, 'store']);
    Route::post('/stories/{story}/view', [StoryController::class, 'view']);
    Route::get('/stories/{story}', [StoryController::class, 'show']);

    // Bookmarks
    Route::get('/bookmarks', [BookmarkController::class, 'index']);
    Route::post('/posts/{post}/bookmark', [BookmarkController::class, 'store']);
    Route::delete('/posts/{post}/bookmark', [BookmarkController::class, 'destroy']);

    // Comments
    Route::get('/posts/{post}/comments', [CommentController::class, 'index']);
    Route::post('/posts/{post}/comments', [CommentController::class, 'store']);
    Route::post('/comments/{comment}/pin', [CommentController::class, 'pin']);
    Route::post('/comments/{comment}/unpin', [CommentController::class, 'unpin']);
    Route::delete('/comments/{comment}', [CommentController::class, 'destroy']);

    // Profile comments (comments on a user's profile)
    Route::get('/users/{user}/profile-comments', [ProfileCommentController::class, 'index']);
    Route::post('/users/{user}/profile-comments', [ProfileCommentController::class, 'store']);
    Route::put('/profile-comments/{profile_comment}', [ProfileCommentController::class, 'update']);
    Route::post('/profile-comments/{profile_comment}/hide', [ProfileCommentController::class, 'hide']);
    Route::post('/profile-comments/{profile_comment}/unhide', [ProfileCommentController::class, 'unhide']);
    Route::delete('/profile-comments/{profile_comment}', [ProfileCommentController::class, 'destroy']);

    // Follow/Unfollow (now sends friend requests)
    Route::post('/users/{id}/follow', [FollowController::class, 'follow']);
    Route::delete('/users/{id}/unfollow', [FollowController::class, 'unfollow']);

    // Block users
    Route::get('/blocks', [BlockController::class, 'index']);
    Route::post('/users/{id}/block', [BlockController::class, 'store']);
    Route::delete('/users/{id}/block', [BlockController::class, 'destroy']);
    Route::get('/users/{id}/block-status', [BlockController::class, 'status']);

    // Friend Requests
    Route::get('/friend-requests', [FriendRequestController::class, 'index']);
    Route::post('/users/{id}/friend-request', [FriendRequestController::class, 'store']);
    Route::post('/friend-requests/{friendRequest}/accept', [FriendRequestController::class, 'accept']);
    Route::post('/friend-requests/{friendRequest}/reject', [FriendRequestController::class, 'reject']);
    Route::delete('/friend-requests/{friendRequest}', [FriendRequestController::class, 'cancel']);

    // Search
    Route::get('/search', [SearchController::class, 'search']);
    Route::get('/search/suggestions', [SearchController::class, 'suggestions']);

    // Trending
    Route::get('/trending/hashtags', [TrendingController::class, 'hashtags']);
    Route::get('/trending/posts', [TrendingController::class, 'posts']);
    Route::get('/trending/hashtag-posts', [TrendingController::class, 'hashtagPosts']);

    // Reports
    Route::post('/reports', [ReportController::class, 'store']);
    Route::get('/reports/status', [ReportController::class, 'status']);

    // Moderation warnings (member: view warning context, submit appeal)
    Route::get('/warning-events/{moderationEvent}', [WarningEventController::class, 'show']);
    Route::post('/warning-appeals', [WarningAppealController::class, 'store']);

    // Communities
    Route::get('/communities', [CommunityController::class, 'index']);
    Route::post('/communities', [CommunityController::class, 'store']);
    Route::get('/communities/{community}', [CommunityController::class, 'show']);
    Route::put('/communities/{community}', [CommunityController::class, 'update']);
    Route::delete('/communities/{community}', [CommunityController::class, 'destroy']);
    Route::post('/communities/{community}/join', [CommunityController::class, 'join']);
    Route::delete('/communities/{community}/join-request', [CommunityController::class, 'cancelJoinRequest']);
    Route::delete('/communities/{community}/leave', [CommunityController::class, 'leave']);
    Route::get('/communities/{community}/join-requests', [CommunityController::class, 'joinRequests']);
    Route::post('/communities/{community}/join-requests/{joinRequest}/approve', [CommunityController::class, 'approveJoinRequest']);
    Route::post('/communities/{community}/join-requests/{joinRequest}/reject', [CommunityController::class, 'rejectJoinRequest']);
    Route::get('/communities/{community}/members', [CommunityController::class, 'members']);
    Route::put('/communities/{community}/members/{user}', [CommunityController::class, 'updateMemberRole']);
    Route::delete('/communities/{community}/members/{user}', [CommunityController::class, 'removeMember']);
    Route::get('/communities/{community}/posts', [CommunityController::class, 'posts']);
    Route::get('/communities/{community}/posts/pending', [CommunityController::class, 'pendingPosts']);
    Route::post('/communities/{community}/posts', [CommunityController::class, 'submitPost']);
    Route::post('/communities/{community}/posts/{post}/approve', [CommunityController::class, 'approvePost']);
    Route::post('/communities/{community}/posts/{post}/reject', [CommunityController::class, 'rejectPost']);
    Route::get('/communities/{community}/invites', [CommunityController::class, 'pendingInvites']);
    Route::post('/communities/{community}/invites', [CommunityController::class, 'invite']);
    Route::post('/communities/{community}/invites/suggest', [CommunityController::class, 'suggestInvite']);
    Route::post('/communities/{community}/invites/{invite}/approve', [CommunityController::class, 'approveInvite']);
    Route::post('/communities/{community}/invites/{invite}/reject', [CommunityController::class, 'rejectInvite']);
    Route::post('/communities/{community}/invites/{invite}/accept', [CommunityController::class, 'acceptInvite']);
    Route::post('/communities/{community}/invites/{invite}/decline', [CommunityController::class, 'declineInvite']);

    // Conversations
    Route::get('/conversations', [ConversationController::class, 'index']);

    // Group conversations
    Route::get('/group-conversations', [GroupConversationController::class, 'index']);
    Route::post('/group-conversations', [GroupConversationController::class, 'store']);
    Route::get('/group-conversations/{groupConversation}', [GroupConversationController::class, 'show']);
    Route::post('/group-conversations/{groupConversation}/members', [GroupConversationController::class, 'addMembers']);
    Route::delete('/group-conversations/{groupConversation}/members/{user}', [GroupConversationController::class, 'removeMember']);
    Route::put('/group-conversations/{groupConversation}/members/{user}/nickname', [GroupConversationController::class, 'setNickname']);
    Route::post('/group-messages', [GroupMessageController::class, 'store']);
    Route::patch('/group-messages/{groupMessage}', [GroupMessageController::class, 'update']);
    Route::delete('/group-messages/{groupMessage}', [GroupMessageController::class, 'destroy']);
    Route::get('/conversations/by-username/{username}', [ConversationController::class, 'getByUsername']);
    Route::get('/conversations/{conversation}', [ConversationController::class, 'show']);

    // Messages
    Route::post('/messages', [MessageController::class, 'store']);
    Route::patch('/messages/{message}', [MessageController::class, 'update']);
    Route::delete('/messages/{message}', [MessageController::class, 'destroy']);
    Route::post('/messages/{message}/pin', [MessageController::class, 'pin']);
    Route::post('/messages/{message}/unpin', [MessageController::class, 'unpin']);
    Route::get('/conversations/{conversation}/messages', [MessageController::class, 'index']);
    Route::get('/conversations/{conversation}/media', [MessageController::class, 'media']);
    Route::post('/conversations/{conversation}/read', [MessageController::class, 'markAsRead']);

    // Notifications (read-all must be before {id} to avoid matching "read-all" as id)
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::get('/notifications/highlights', [NotificationController::class, 'highlights']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);

    // Admin routes
    Route::prefix('admin')->middleware('admin')->group(function () {
        Route::get('/users/stats', [\App\Http\Controllers\Api\Admin\AdminUserController::class, 'stats']);
        Route::get('/users', [\App\Http\Controllers\Api\Admin\AdminUserController::class, 'index']);
        Route::get('/users/{user}/moderation', [\App\Http\Controllers\Api\Admin\AdminUserController::class, 'moderationDetails']);
        Route::post('/users/{user}/warn', [\App\Http\Controllers\Api\Admin\AdminUserController::class, 'warn']);
        Route::post('/users/{user}/ban', [\App\Http\Controllers\Api\Admin\AdminUserController::class, 'ban']);
        Route::put('/users/{user}/role', [\App\Http\Controllers\Api\Admin\AdminUserController::class, 'updateRole']);
        Route::post('/users/{user}/suspend', [\App\Http\Controllers\Api\Admin\AdminUserController::class, 'suspend']);
        Route::post('/users/{user}/unsuspend', [\App\Http\Controllers\Api\Admin\AdminUserController::class, 'unsuspend']);

        Route::get('/reports/stats', [\App\Http\Controllers\Api\Admin\AdminReportController::class, 'stats']);
        Route::get('/reports', [\App\Http\Controllers\Api\Admin\AdminReportController::class, 'index']);
        Route::post('/reports/{report}/dismiss', [\App\Http\Controllers\Api\Admin\AdminReportController::class, 'dismiss']);
        Route::post('/reports/{report}/action-taken', [\App\Http\Controllers\Api\Admin\AdminReportController::class, 'actionTaken']);
        Route::post('/reports/{report}/remove-post', [\App\Http\Controllers\Api\Admin\AdminReportController::class, 'removePost']);
        Route::post('/reports/{report}/remove-profile-comment', [\App\Http\Controllers\Api\Admin\AdminReportController::class, 'removeProfileComment']);

        Route::get('/warning-appeals', [AdminWarningAppealController::class, 'index']);
        Route::post('/warning-appeals/{warningAppeal}/respond', [AdminWarningAppealController::class, 'respond']);

        Route::get('/ban-appeals', [AdminBanAppealController::class, 'index']);
        Route::post('/ban-appeals/{banAppeal}/respond', [AdminBanAppealController::class, 'respond']);

        Route::get('/settings', [\App\Http\Controllers\Api\Admin\AdminSettingsController::class, 'index']);
    });
});
