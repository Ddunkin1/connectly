<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\Process;

/**
 * Transcode video to H.264/AAC MP4 with faststart for cross-browser playback (Chrome, Edge, Firefox, Safari).
 */
class VideoTranscodeService
{
    /**
     * Transcode a video file to web-friendly MP4 (libx264, main profile, AAC, faststart).
     *
     * @param string $inputPath Absolute path to the input video (e.g. uploaded file real path)
     * @return string|null Absolute path to the transcoded .mp4 file, or null on failure. Caller must unlink.
     */
    public function transcode(string $inputPath): ?string
    {
        if (!is_file($inputPath) || !is_readable($inputPath)) {
            Log::warning('VideoTranscodeService: input file not found or not readable', ['path' => $inputPath]);
            return null;
        }

        $outputPath = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'connectly_' . uniqid('video_', true) . '.mp4';

        $ffmpeg = config('services.ffmpeg.path', 'ffmpeg');

        // ffmpeg -i input -c:v libx264 -profile:v main -c:a aac -movflags +faststart output.mp4
        $command = [
            $ffmpeg,
            '-y',
            '-i',
            $inputPath,
            '-c:v',
            'libx264',
            '-profile:v',
            'main',
            '-c:a',
            'aac',
            '-movflags',
            '+faststart',
            $outputPath,
        ];

        try {
            $process = new Process($command);
            $process->setTimeout(600); // 10 minutes for large files
            $process->run();

            if (!$process->isSuccessful()) {
                Log::error('VideoTranscodeService: ffmpeg failed', [
                    'exit_code' => $process->getExitCode(),
                    'output' => $process->getOutput(),
                    'error_output' => $process->getErrorOutput(),
                ]);
                if (is_file($outputPath)) {
                    @unlink($outputPath);
                }
                return null;
            }

            if (!is_file($outputPath) || filesize($outputPath) === 0) {
                Log::error('VideoTranscodeService: transcoded file missing or empty');
                if (is_file($outputPath)) {
                    @unlink($outputPath);
                }
                return null;
            }

            return $outputPath;
        } catch (\Throwable $e) {
            Log::error('VideoTranscodeService: exception', ['message' => $e->getMessage()]);
            if (is_file($outputPath)) {
                @unlink($outputPath);
            }
            return null;
        }
    }

    /**
     * Check if ffmpeg is available on the system.
     */
    public function isAvailable(): bool
    {
        $ffmpeg = config('services.ffmpeg.path', 'ffmpeg');
        $process = new Process([$ffmpeg, '-version']);
        $process->run();
        return $process->isSuccessful();
    }
}
