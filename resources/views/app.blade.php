<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ config('app.name', 'Connectly') }}</title>
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/main.jsx'])
</head>
<body>
    <div id="app">
        <div style="padding: 20px; text-align: center;">
            <p>Loading Connectly...</p>
            <p style="font-size: 12px; color: #666;">If this message persists, check the browser console for errors.</p>
        </div>
    </div>
    <script>
        // Capture first script error so we can show it if React doesn't mount
        window.__reactMountError = null;
        window.addEventListener('error', function(e) {
            if (!window.__reactMountError) {
                window.__reactMountError = e.message + ' at ' + (e.filename || '') + ':' + (e.lineno || '');
            }
        });
        window.addEventListener('load', function() {
            setTimeout(function() {
                var app = document.getElementById('app');
                if (app && app.children.length === 1 && app.children[0].textContent.includes('Loading')) {
                    console.error('React app did not mount! Check console for errors.');
                    if (window.__reactMountError) {
                        app.innerHTML = '<div style="padding: 20px; font-family: sans-serif; max-width: 600px; margin: 20px auto;">' +
                            '<h2 style="color: #c00;">React failed to load</h2>' +
                            '<pre style="background: #f5f5f5; padding: 12px; overflow: auto; font-size: 12px;">' + window.__reactMountError + '</pre>' +
                            '<p>Fix the error above and refresh the page.</p></div>';
                    }
                }
            }, 3000);
        });
    </script>
</body>
</html>
