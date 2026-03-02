<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CommunityResource;
use App\Http\Resources\PostResource;
use App\Http\Resources\UserResource;
use App\Models\Community;
use App\Models\Hashtag;
use App\Models\Post;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    /**
     * Search across users, posts, communities, and hashtags.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function search(Request $request): JsonResponse
    {
        $query = $request->input('q', '');
        $type = $request->input('type', 'all'); // all, users, posts, communities, hashtags
        $page = $request->input('page', 1);
        $perPage = 15;

        if (empty(trim($query))) {
            return response()->json([
                'query' => $query,
                'type' => $type,
                'users' => [],
                'posts' => [],
                'communities' => [],
                'hashtags' => [],
            ]);
        }

        $searchTerm = '%' . $query . '%';
        $results = [
            'users' => [],
            'posts' => [],
            'communities' => [],
            'hashtags' => [],
        ];

        $currentUser = $request->user();
        $blockedIds = $currentUser
            ? array_merge($currentUser->blockedUserIds(), $currentUser->blockedByUserIds())
            : [];

        // Search Users
        if ($type === 'all' || $type === 'users') {
            $usersQuery = User::where(function ($q) use ($searchTerm) {
                $q->where('name', 'LIKE', $searchTerm)
                    ->orWhere('username', 'LIKE', $searchTerm)
                    ->orWhere('bio', 'LIKE', $searchTerm);
            });
            if (!empty($blockedIds)) {
                $usersQuery->whereNotIn('id', $blockedIds);
            }
            $users = $usersQuery
                ->withCount(['followers', 'following'])
                ->paginate($perPage, ['*'], 'users_page', $page);

            $results['users'] = UserResource::collection($users->items());
        }

        // Search Posts
        if ($type === 'all' || $type === 'posts') {
            $postsQuery = Post::where('content', 'LIKE', $searchTerm)
                ->with(['user', 'hashtags'])
                ->withCount(['likes', 'allComments'])
                ->orderBy('created_at', 'desc');
            if (!empty($blockedIds)) {
                $postsQuery->whereNotIn('user_id', $blockedIds);
            }
            $posts = $postsQuery->paginate($perPage, ['*'], 'posts_page', $page);

            $results['posts'] = PostResource::collection($posts->items());
        }

        // Search Communities
        if ($type === 'all' || $type === 'communities') {
            $communities = Community::where(function ($q) use ($searchTerm) {
                $q->where('name', 'LIKE', $searchTerm)
                    ->orWhere('description', 'LIKE', $searchTerm)
                    ->orWhere('slug', 'LIKE', $searchTerm);
            })
                ->with(['creator'])
                ->withCount('members')
                ->paginate($perPage, ['*'], 'communities_page', $page);

            $results['communities'] = CommunityResource::collection($communities->items());
        }

        // Search Hashtags
        if ($type === 'all' || $type === 'hashtags') {
            $hashtags = Hashtag::where('name', 'LIKE', $searchTerm)
                ->withCount('posts')
                ->paginate($perPage, ['*'], 'hashtags_page', $page);

            $results['hashtags'] = $hashtags->map(function ($hashtag) {
                return [
                    'id' => $hashtag->id,
                    'name' => $hashtag->name,
                    'posts_count' => $hashtag->posts_count ?? 0,
                ];
            });
        }

        return response()->json([
            'query' => $query,
            'type' => $type,
            'users' => $results['users'],
            'posts' => $results['posts'],
            'communities' => $results['communities'],
            'hashtags' => $results['hashtags'],
        ]);
    }

    /**
     * Lightweight suggestions for autocomplete (users + hashtags + communities).
     */
    public function suggestions(Request $request): JsonResponse
    {
        $q = trim((string) $request->input('q', ''));

        if ($q === '') {
            return response()->json([
                'users' => [],
                'hashtags' => [],
                'communities' => [],
            ]);
        }

        $user = $request->user();
        $blockedIds = $user ? array_merge($user->blockedUserIds(), $user->blockedByUserIds()) : [];

        $users = User::query()
            ->when(!empty($blockedIds), fn ($query) => $query->whereNotIn('id', $blockedIds))
            ->where(function ($query) use ($q) {
                $query->where('username', 'like', $q . '%')
                    ->orWhere('name', 'like', $q . '%');
            })
            ->limit(5)
            ->get();

        $hashtags = Hashtag::query()
            ->where('name', 'like', $q . '%')
            ->limit(5)
            ->get();

        $communities = Community::query()
            ->where('name', 'like', $q . '%')
            ->limit(5)
            ->get();

        return response()->json([
            'users' => $users->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'username' => $u->username,
                'profile_picture' => $u->profile_picture,
            ]),
            'hashtags' => $hashtags->map(fn (Hashtag $h) => [
                'id' => $h->id,
                'name' => $h->name,
            ]),
            'communities' => $communities->map(fn (Community $c) => [
                'id' => $c->id,
                'name' => $c->name,
            ]),
        ]);
    }
}
