<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ config('app.name', 'Connectly') }}</title>
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
</head>
<body>
    <div id="app">
        <div style="padding: 20px; text-align: center;">
            <p>Loading Connectly...</p>
            <p style="font-size: 12px; color: #666;">If this message persists, check the browser console for errors.</p>
        </div>
    </div>
    <script>
        // Debug: Check if Vite is loading
        console.log('Blade template loaded');
        window.addEventListener('load', function() {
            console.log('Page loaded');
            setTimeout(function() {
                if (document.getElementById('app').children.length === 1 && document.getElementById('app').children[0].textContent.includes('Loading')) {
                    console.error('React app did not mount! Check console for errors.');
                }
            }, 2000);
        });
    </script>
</body>
</html>
