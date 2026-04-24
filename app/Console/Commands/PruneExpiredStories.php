<?php

namespace App\Console\Commands;

use App\Models\Story;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class PruneExpiredStories extends Command
{
    protected $signature = 'prune:expired-stories';
    protected $description = 'Delete stories and notifications past their retention window';

    public function handle(): int
    {
        // Delete expired stories
        $stories = Story::where('expires_at', '<=', now())->count();
        Story::where('expires_at', '<=', now())->delete();
        $this->info("Deleted {$stories} expired stories.");

        // Delete read notifications older than 30 days
        $notifications = DB::table('notifications')
            ->whereNotNull('read_at')
            ->where('read_at', '<=', now()->subDays(30))
            ->count();
        DB::table('notifications')
            ->whereNotNull('read_at')
            ->where('read_at', '<=', now()->subDays(30))
            ->delete();
        $this->info("Deleted {$notifications} old read notifications.");

        // Prune expired database sessions
        $sessions = DB::table('sessions')
            ->where('last_activity', '<=', now()->subDays(7)->timestamp)
            ->count();
        DB::table('sessions')
            ->where('last_activity', '<=', now()->subDays(7)->timestamp)
            ->delete();
        $this->info("Deleted {$sessions} expired sessions.");

        return self::SUCCESS;
    }
}
