<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\Report;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminReportController extends Controller
{
    /**
     * List reports for admin queue.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->input('per_page', 20);
        $status = $request->input('status', 'pending');

        $query = Report::with(['reporter', 'reportable'])
            ->orderBy('created_at', 'desc');

        if ($status && in_array($status, ['pending', 'reviewed', 'dismissed', 'action_taken'], true)) {
            $query->where('status', $status);
        }

        $reports = $query->paginate($perPage);

        $items = $reports->getCollection()->map(function ($report) {
            $reportable = $report->reportable;
            $reportableData = null;
            if ($reportable instanceof User) {
                $reportableData = [
                    'type' => 'user',
                    'id' => $reportable->id,
                    'username' => $reportable->username,
                    'name' => $reportable->name,
                    'profile_picture' => $reportable->profile_picture,
                ];
            } elseif ($reportable instanceof Post) {
                $reportableData = [
                    'type' => 'post',
                    'id' => $reportable->id,
                    'content' => \Str::limit($reportable->content, 100),
                    'user_id' => $reportable->user_id,
                    'user' => $reportable->user ? [
                        'id' => $reportable->user->id,
                        'username' => $reportable->user->username,
                        'name' => $reportable->user->name,
                    ] : null,
                ];
            }

            return [
                'id' => $report->id,
                'reporter' => [
                    'id' => $report->reporter->id,
                    'username' => $report->reporter->username,
                    'name' => $report->reporter->name,
                ],
                'reportable' => $reportableData,
                'reason' => $report->reason,
                'description' => $report->description,
                'status' => $report->status,
                'created_at' => $report->created_at?->toIso8601String(),
            ];
        });

        return response()->json([
            'reports' => $items,
            'pagination' => [
                'current_page' => $reports->currentPage(),
                'last_page' => $reports->lastPage(),
                'per_page' => $reports->perPage(),
                'total' => $reports->total(),
            ],
        ]);
    }

    /**
     * Dismiss a report.
     */
    public function dismiss(Report $report): JsonResponse
    {
        $report->update(['status' => Report::STATUS_DISMISSED]);

        return response()->json(['message' => 'Report dismissed']);
    }

    /**
     * Mark report as action taken (e.g. content removed, user suspended).
     */
    public function actionTaken(Report $report): JsonResponse
    {
        $report->update(['status' => Report::STATUS_ACTION_TAKEN]);

        return response()->json(['message' => 'Report marked as action taken']);
    }

    /**
     * Remove reported post (admin action).
     */
    public function removePost(Report $report): JsonResponse
    {
        $post = $report->reportable;
        if (!$post instanceof Post) {
            return response()->json(['message' => 'Report is not for a post'], 400);
        }

        $post->delete();
        $report->update(['status' => Report::STATUS_ACTION_TAKEN]);

        return response()->json(['message' => 'Post removed']);
    }
}
