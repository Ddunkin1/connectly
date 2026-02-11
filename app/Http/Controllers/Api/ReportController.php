<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\Report;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ReportController extends Controller
{
    /**
     * Report a user or post.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'reportable_type' => ['required', Rule::in(['user', 'post'])],
            'reportable_id' => ['required', 'integer'],
            'reason' => ['required', Rule::in(Report::REASONS)],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $reporter = $request->user();
        $reportableType = $request->reportable_type === 'user' ? User::class : Post::class;

        $reportable = $reportableType::find($request->reportable_id);
        if (!$reportable) {
            return response()->json(['message' => 'Resource not found'], 404);
        }

        // Cannot report yourself
        if ($reportable instanceof User && $reportable->id === $reporter->id) {
            return response()->json(['message' => 'You cannot report yourself'], 400);
        }

        // Cannot report own post
        if ($reportable instanceof Post && $reportable->user_id === $reporter->id) {
            return response()->json(['message' => 'You cannot report your own post'], 400);
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
            'message' => 'Report submitted successfully. Our team will review it.',
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
            'reportable_type' => ['required', Rule::in(['user', 'post'])],
            'reportable_id' => ['required', 'integer'],
        ]);

        $reportableType = $request->reportable_type === 'user' ? User::class : Post::class;
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
