<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\ProfileComment;
use App\Models\Report;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ReportController extends Controller
{
    private const REPORTABLE_MAP = [
        'user' => User::class,
        'post' => Post::class,
        'profile_comment' => ProfileComment::class,
    ];

    /**
     * Report a user, post, or profile comment.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'reportable_type' => ['required', Rule::in(array_keys(self::REPORTABLE_MAP))],
            'reportable_id' => ['required', 'integer'],
            'reason' => ['required', Rule::in(Report::REASONS)],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $reporter = $request->user();
        $reportableType = self::REPORTABLE_MAP[$request->reportable_type];
        $reportable = $reportableType::find($request->reportable_id);

        if (!$reportable) {
            return response()->json(['message' => 'Resource not found'], 404);
        }

        if ($reportable instanceof User && $reportable->id === $reporter->id) {
            return response()->json(['message' => 'You cannot report yourself'], 400);
        }

        if ($reportable instanceof Post && $reportable->user_id === $reporter->id) {
            return response()->json(['message' => 'You cannot report your own post'], 400);
        }

        if ($reportable instanceof ProfileComment && $reportable->author_id === $reporter->id) {
            return response()->json(['message' => 'You cannot report your own comment'], 400);
        }

        $existing = Report::where('reporter_id', $reporter->id)
            ->where('reportable_type', $reportableType)
            ->where('reportable_id', $reportable->id)
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'You have already reported this content',
                'report' => ['id' => $existing->id, 'status' => $existing->status],
            ], 400);
        }

        $report = Report::create([
            'reporter_id' => $reporter->id,
            'reportable_type' => $reportableType,
            'reportable_id' => $reportable->id,
            'reason' => $request->reason,
            'description' => $request->description,
        ]);

        return response()->json([
            'message' => 'Thanks — we received your report. Our team will investigate and follow up as soon as possible.',
            'report' => [
                'id' => $report->id,
                'status' => $report->status,
            ],
        ], 201);
    }

    /**
     * Check if the current user has reported a given resource.
     */
    public function status(Request $request): JsonResponse
    {
        $request->validate([
            'reportable_type' => ['required', Rule::in(array_keys(self::REPORTABLE_MAP))],
            'reportable_id' => ['required', 'integer'],
        ]);

        $reportableType = self::REPORTABLE_MAP[$request->reportable_type];
        $report = Report::where('reporter_id', $request->user()->id)
            ->where('reportable_type', $reportableType)
            ->where('reportable_id', $request->reportable_id)
            ->first();

        return response()->json([
            'reported' => $report !== null,
            'status' => $report?->status,
        ]);
    }
}
