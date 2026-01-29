<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EdgeStoreController extends Controller
{
    /**
     * Handle EdgeStore API requests
     * EdgeStore React components need this endpoint for initialization.
     * Files are uploaded directly to EdgeStore cloud service from the frontend.
     *
     * @param Request $request
     * @param string|null $any
     * @return JsonResponse
     */
    public function handle(Request $request, ?string $any = null): JsonResponse
    {
        try {
            $path = $request->path();
            $method = $request->method();
            $requestPath = $any ?? '';
            
            // Handle EdgeStore initialization request
            // EdgeStore React components call POST /api/edgestore/init
            if ($requestPath === 'init' || str_ends_with($path, '/init')) {
                // Return a simple success response
                // EdgeStore React components need this to initialize
                return response()->json([
                    'success' => true,
                ], 200);
            }
            
            // Handle file upload request (request-upload)
            // EdgeStore may call this before uploading
            if (str_contains($requestPath, 'request-upload') || str_contains($path, 'request-upload')) {
                // Return success - EdgeStore handles uploads to their cloud
                return response()->json([
                    'success' => true,
                ], 200);
            }
            
            // Handle any other EdgeStore operations
            return response()->json([
                'success' => true,
            ], 200);
            
        } catch (\Exception $e) {
            Log::error('EdgeStore Controller Error: ' . $e->getMessage());
            return response()->json([
                'error' => 'EdgeStore operation failed',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
