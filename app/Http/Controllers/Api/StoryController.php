<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Story;
use App\Models\User;
use App\Services\StoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StoryController extends Controller
{
    public function __construct(
        private StoryService $storyService
    ) {
    }

    /**
     * List stories for feed (grouped by user, only non-expired).
     */
    public function index(Request $request): JsonResponse
    {
        $stories = $this->storyService->getStoriesForFeed($request->user());

        return response()->json([
            'stories' => $stories,
        ]);
    }

    /**
     * Create a new story.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'media' => [
                'required',
                'file',
                'max:51200', // 50MB for videos
                function ($attribute, $value, $fail) {
                    if (!$value instanceof \Illuminate\Http\UploadedFile) {
                        return;
                    }
                    $mime = $value->getMimeType();
                    $validImage = str_starts_with($mime ?? '', 'image/');
                    $validVideo = str_starts_with($mime ?? '', 'video/');
                    if (!$validImage && !$validVideo) {
                        $fail('File must be an image (JPEG, PNG, GIF, WebP) or video (MP4, MOV, AVI, WebM).');
                    }
                },
            ],
            'caption' => ['nullable', 'string', 'max:500'],
        ]);

        $story = $this->storyService->createStory($request->user(), $request->file('media'), $request->input('caption'));

        return response()->json([
            'message' => 'Story created',
            'story' => $story->load('user'),
        ], 201);
    }

    /**
     * Get a single story (for viewer navigation).
     */
    public function show(Request $request, Story $story): JsonResponse
    {
        if ($story->expires_at <= now()) {
            return response()->json(['message' => 'Story has expired'], 404);
        }

        $story->load('user');

        return response()->json(['story' => $story]);
    }
}
