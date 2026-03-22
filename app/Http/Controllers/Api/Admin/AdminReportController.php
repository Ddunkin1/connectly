<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\ProfileComment;
use App\Models\Report;
use App\Models\User;
use App\Notifications\ContentRemovedByModerationNotification;
use App\Notifications\ReportOutcomeNotification;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AdminReportController extends Controller
{
    private const REPORTABLE_TYPE_MAP = [
        'user' => User::class,
        'post' => Post::class,
        'profile_comment' => ProfileComment::class,
    ];

    /**
     * List reports for admin queue.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->input('per_page', 20);
        $status = $request->input('status', 'all');
        $reportableTypeFilter = $request->input('reportable_type', 'all');
        $reasonFilter = $request->input('reason');
        $priority = $request->input('priority', 'all');

        $query = Report::with(['reporter'])
            ->with(['reportable' => function (MorphTo $morphTo) {
                $morphTo->morphWith([
                    Post::class => ['user'],
                    ProfileComment::class => ['user', 'author'],
                ]);
            }])
            ->orderBy('created_at', 'desc');

        if ($status && $status !== 'all' && in_array($status, ['pending', 'reviewed', 'dismissed', 'action_taken'], true)) {
            $query->where('status', $status);
        }

        if ($reportableTypeFilter && $reportableTypeFilter !== 'all') {
            $class = self::REPORTABLE_TYPE_MAP[$reportableTypeFilter] ?? null;
            if ($class) {
                $query->where('reportable_type', $class);
            }
        }

        if ($reasonFilter && $reasonFilter !== 'all' && in_array($reasonFilter, Report::REASONS, true)) {
            $query->where('reason', $reasonFilter);
        }

        if ($priority === 'urgent') {
            $query->whereIn('reason', Report::URGENT_REASONS);
        } elseif ($priority === 'standard') {
            $query->whereNotIn('reason', Report::URGENT_REASONS);
        }

        $reports = $query->paginate($perPage);

        $items = $reports->getCollection()->map(fn ($report) => $this->serializeReport($report));

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
     * Counts by status and reportable type for admin dashboard cards.
     */
    public function stats(): JsonResponse
    {
        $byStatus = Report::query()
            ->select('status', DB::raw('count(*) as c'))
            ->groupBy('status')
            ->pluck('c', 'status');

        $byMorph = Report::query()
            ->select('reportable_type', DB::raw('count(*) as c'))
            ->groupBy('reportable_type')
            ->get();

        $byType = [
            'user' => 0,
            'post' => 0,
            'profile_comment' => 0,
        ];
        foreach ($byMorph as $row) {
            $short = match ($row->reportable_type) {
                User::class => 'user',
                Post::class => 'post',
                ProfileComment::class => 'profile_comment',
                default => null,
            };
            if ($short !== null) {
                $byType[$short] = (int) $row->c;
            }
        }

        return response()->json([
            'by_status' => [
                'pending' => (int) ($byStatus[Report::STATUS_PENDING] ?? 0),
                'reviewed' => (int) ($byStatus[Report::STATUS_REVIEWED] ?? 0),
                'dismissed' => (int) ($byStatus[Report::STATUS_DISMISSED] ?? 0),
                'action_taken' => (int) ($byStatus[Report::STATUS_ACTION_TAKEN] ?? 0),
            ],
            'by_reportable_type' => $byType,
            'total' => Report::query()->count(),
        ]);
    }

    private function serializeReport(Report $report): array
    {
        $reportable = $report->reportable;
        $reportableData = null;

        if ($reportable === null) {
            $reportableData = [
                'type' => 'deleted',
                'id' => null,
                'message' => 'Reported content is no longer available',
            ];
        } elseif ($reportable instanceof User) {
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
                'content' => \Str::limit((string) $reportable->content, 220),
                'media_url' => $reportable->media_url,
                'media_type' => $reportable->media_type,
                'user_id' => $reportable->user_id,
                'user' => $reportable->user ? [
                    'id' => $reportable->user->id,
                    'username' => $reportable->user->username,
                    'name' => $reportable->user->name,
                ] : null,
            ];
        } elseif ($reportable instanceof ProfileComment) {
            $reportableData = [
                'type' => 'profile_comment',
                'id' => $reportable->id,
                'content' => \Str::limit((string) $reportable->content, 100),
                'content_full' => (string) $reportable->content,
                'profile_user_id' => $reportable->user_id,
                'profile_username' => $reportable->user?->username,
                'profile_name' => $reportable->user?->name,
                'author' => $reportable->author ? [
                    'id' => $reportable->author->id,
                    'username' => $reportable->author->username,
                    'name' => $reportable->author->name,
                    'profile_picture' => $reportable->author->profile_picture,
                ] : null,
            ];
        }

        return [
            'id' => $report->id,
            'reportable_type' => $report->reportable_type,
            'reporter' => [
                'id' => $report->reporter->id,
                'username' => $report->reporter->username,
                'name' => $report->reporter->name,
            ],
            'reportable' => $reportableData,
            'reason' => $report->reason,
            'description' => $report->description,
            'status' => $report->status,
            'urgent' => in_array($report->reason, Report::URGENT_REASONS, true),
            'created_at' => $report->created_at?->toIso8601String(),
        ];
    }

    /**
     * Dismiss a report (cancel with no enforcement action).
     * `reason` uses the same enum as user-submitted reports; `message` is shown to the reporter.
     */
    public function dismiss(Request $request, Report $report): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', Rule::in(Report::REASONS)],
            'message' => ['required', 'string', 'min:10', 'max:2000'],
        ]);

        $report->loadMissing('reporter');
        $report->update([
            'status' => Report::STATUS_DISMISSED,
            'dismissal_reason' => $validated['reason'],
            'dismissal_message' => $validated['message'],
        ]);

        if ($report->reporter) {
            $report->reporter->notify(new ReportOutcomeNotification($report, 'dismissed'));
        }

        return response()->json(['message' => 'Report dismissed']);
    }

    /**
     * Mark report as action taken (e.g. content removed, user suspended).
     */
    public function actionTaken(Report $report): JsonResponse
    {
        $report->loadMissing('reporter');
        $report->update(['status' => Report::STATUS_ACTION_TAKEN]);

        if ($report->reporter) {
            $report->reporter->notify(new ReportOutcomeNotification($report, 'resolved'));
        }

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

        $report->loadMissing('reporter');
        $post->loadMissing('user');
        $author = $post->user;

        $post->delete();
        $report->update(['status' => Report::STATUS_ACTION_TAKEN]);

        if ($report->reporter) {
            $report->reporter->notify(new ReportOutcomeNotification($report, 'content_removed'));
        }
        if ($author && (!$report->reporter || $author->id !== $report->reporter->id)) {
            $author->notify(new ContentRemovedByModerationNotification($report));
        }

        return response()->json(['message' => 'Post removed']);
    }

    /**
     * Delete reported profile comment (admin action).
     */
    public function removeProfileComment(Report $report): JsonResponse
    {
        $comment = $report->reportable;
        if (!$comment instanceof ProfileComment) {
            return response()->json(['message' => 'Report is not for a profile comment'], 400);
        }

        $report->loadMissing('reporter');
        $comment->loadMissing('author');

        $author = $comment->author;

        $comment->delete();
        $report->update(['status' => Report::STATUS_ACTION_TAKEN]);

        if ($report->reporter) {
            $report->reporter->notify(new ReportOutcomeNotification($report, 'content_removed'));
        }
        if ($author && (!$report->reporter || $author->id !== $report->reporter->id)) {
            $author->notify(new ContentRemovedByModerationNotification($report));
        }

        return response()->json(['message' => 'Comment removed']);
    }
}
