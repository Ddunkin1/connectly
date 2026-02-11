<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('app');
});

// Catch-all route for SPA (exclude API routes)
Route::get('/{any}', function () {
    return view('app');
})->where('any', '^(?!api|storage|_dusk|sanctum|up).*');
