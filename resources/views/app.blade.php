<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <script>
        (function() {
            try {
                var raw = localStorage.getItem('connectly-theme');
                if (!raw) return;
                var state = JSON.parse(raw);
                var s = state?.state ?? state;
                if (!s) return;
                var root = document.documentElement;
                if (s.fontSize && ['sm','md','lg'].includes(s.fontSize)) root.setAttribute('data-font-size', s.fontSize);
                if (s.accentColor) root.setAttribute('data-accent', s.accentColor);
                if (s.background) root.setAttribute('data-background', s.background);
                if (['stitch','dim','dark'].includes(s.background)) root.classList.add('dark');
                if (s.background === 'dim' || ['stitch','dark'].includes(s.background)) {
                    document.body?.classList.add('initial-app-dim');
                }
            } catch (e) {}
        })();
    </script>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ config('app.name', 'Connectly') }}</title>
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/main.jsx'])
    <style id="initial-skeleton-styles">
        :root {
            --sk-bg: #f5f7f8;
            --sk-surface: #ffffff;
            --sk-border: #e2e8f0;
            --sk-shimmer: #e2e8f0;
            --sk-header: #ffffff;
        }
        html.dark {
            --sk-bg: #0a0a0b;
            --sk-surface: #1a1a1a;
            --sk-border: #2a2a2a;
            --sk-shimmer: #2a2a2a;
            --sk-header: #1a1a1a;
        }
        @keyframes initial-sk-pulse {
            0%, 100% { opacity: 0.55; }
            50% { opacity: 0.95; }
        }
        .initial-sk-block {
            background: var(--sk-shimmer);
            border-radius: 10px;
            animation: initial-sk-pulse 1.15s ease-in-out infinite;
        }
        #app-initial-skeleton {
            min-height: 100vh;
            box-sizing: border-box;
            background: var(--sk-bg);
            font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        }
        .initial-skeleton-inner {
            display: flex;
            flex-direction: column;
            min-height: 100vh;
        }
        .initial-sk-top {
            height: 56px;
            flex-shrink: 0;
            background: var(--sk-header);
            border-bottom: 1px solid var(--sk-border);
            display: flex;
            align-items: center;
            padding: 0 16px;
            gap: 12px;
        }
        .initial-sk-logo { width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0; }
        .initial-sk-title { height: 14px; width: 100px; border-radius: 6px; }
        .initial-sk-title2 { height: 12px; width: 72px; border-radius: 6px; margin-top: 6px; }
        .initial-sk-spacer { flex: 1; }
        .initial-sk-pill { height: 36px; width: 88px; border-radius: 10px; }
        .initial-sk-body {
            flex: 1;
            display: flex;
            min-height: 0;
            overflow: hidden;
        }
        .initial-skeleton--admin .initial-sk-sidebar {
            width: 240px;
            flex-shrink: 0;
            border-right: 1px solid var(--sk-border);
            background: var(--sk-surface);
            padding: 16px 12px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .initial-skeleton--admin .initial-sk-nav-line { height: 40px; border-radius: 10px; width: 100%; }
        .initial-skeleton--member .initial-sk-sidebar { display: none; }
        .initial-sk-main {
            flex: 1;
            padding: 20px 16px;
            min-width: 0;
        }
        .initial-skeleton--member .initial-sk-main {
            max-width: 680px;
            margin: 0 auto;
            width: 100%;
        }
        .initial-sk-card {
            height: 120px;
            border-radius: 16px;
            margin-bottom: 16px;
            border: 1px solid var(--sk-border);
            background: var(--sk-surface);
            padding: 16px;
            box-sizing: border-box;
        }
        .initial-sk-row { display: flex; gap: 12px; align-items: flex-start; }
        .initial-sk-avatar { width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0; }
        .initial-sk-lines { flex: 1; min-width: 0; }
        .initial-sk-line { height: 12px; border-radius: 6px; margin-bottom: 8px; }
        .initial-sk-line.short { width: 45%; }
        .initial-sk-stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-bottom: 20px;
        }
        .initial-sk-stat { height: 72px; border-radius: 14px; border: 1px solid var(--sk-border); background: var(--sk-surface); }
        @media (max-width: 768px) {
            .initial-skeleton--admin .initial-sk-sidebar { display: none; }
        }
    </style>
</head>
<body>
    @php
        $initialAdminShell = request()->is('admin*') && !request()->is('admin/login');
    @endphp
    <div id="app">
        <div id="app-initial-skeleton" class="initial-skeleton {{ $initialAdminShell ? 'initial-skeleton--admin' : 'initial-skeleton--member' }}" data-initial-variant="{{ $initialAdminShell ? 'admin' : 'member' }}">
            <div class="initial-skeleton-inner">
                <header class="initial-sk-top">
                    <div class="initial-sk-block initial-sk-logo" aria-hidden="true"></div>
                    <div>
                        <div class="initial-sk-block initial-sk-title" aria-hidden="true"></div>
                        <div class="initial-sk-block initial-sk-title2" aria-hidden="true"></div>
                    </div>
                    <div class="initial-sk-spacer"></div>
                    <div class="initial-sk-block initial-sk-pill" aria-hidden="true"></div>
                </header>
                <div class="initial-sk-body">
                    <aside class="initial-sk-sidebar" aria-hidden="true">
                        <div class="initial-sk-block initial-sk-nav-line"></div>
                        <div class="initial-sk-block initial-sk-nav-line"></div>
                        <div class="initial-sk-block initial-sk-nav-line"></div>
                        <div class="initial-sk-block initial-sk-nav-line"></div>
                        <div class="initial-sk-block initial-sk-nav-line"></div>
                    </aside>
                    <main class="initial-sk-main">
                        @if($initialAdminShell)
                            <div class="initial-sk-stats">
                                <div class="initial-sk-block initial-sk-stat"></div>
                                <div class="initial-sk-block initial-sk-stat"></div>
                                <div class="initial-sk-block initial-sk-stat"></div>
                            </div>
                        @endif
                        <div class="initial-sk-block initial-sk-card">
                            <div class="initial-sk-row">
                                <div class="initial-sk-block initial-sk-avatar"></div>
                                <div class="initial-sk-lines">
                                    <div class="initial-sk-block initial-sk-line" style="width: 40%;"></div>
                                    <div class="initial-sk-block initial-sk-line short"></div>
                                    <div class="initial-sk-block initial-sk-line" style="width: 85%;"></div>
                                </div>
                            </div>
                        </div>
                        <div class="initial-sk-block initial-sk-card">
                            <div class="initial-sk-row">
                                <div class="initial-sk-block initial-sk-avatar"></div>
                                <div class="initial-sk-lines">
                                    <div class="initial-sk-block initial-sk-line" style="width: 35%;"></div>
                                    <div class="initial-sk-block initial-sk-line" style="width: 92%;"></div>
                                </div>
                            </div>
                        </div>
                        <div class="initial-sk-block initial-sk-card">
                            <div class="initial-sk-row">
                                <div class="initial-sk-block initial-sk-avatar"></div>
                                <div class="initial-sk-lines">
                                    <div class="initial-sk-block initial-sk-line" style="width: 50%;"></div>
                                    <div class="initial-sk-block initial-sk-line short"></div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    </div>
    <script>
        (function() {
            try {
                var path = window.location.pathname || '';
                var sk = document.getElementById('app-initial-skeleton');
                if (!sk) return;
                var wantAdmin = /^\/admin(\/|$)/.test(path) && path.indexOf('/admin/login') !== 0;
                sk.classList.toggle('initial-skeleton--admin', wantAdmin);
                sk.classList.toggle('initial-skeleton--member', !wantAdmin);
                sk.setAttribute('data-initial-variant', wantAdmin ? 'admin' : 'member');
            } catch (e) {}
        })();
    </script>
    <script>
        window.__reactMountError = null;
        window.addEventListener('error', function(e) {
            if (!window.__reactMountError) {
                window.__reactMountError = e.message + ' at ' + (e.filename || '') + ':' + (e.lineno || '');
            }
        });
        window.addEventListener('load', function() {
            setTimeout(function() {
                if (document.documentElement.getAttribute('data-react-mounted') === 'true') return;
                var sk = document.getElementById('app-initial-skeleton');
                if (sk && document.body.contains(sk)) {
                    console.error('React app did not mount! Check console for errors.');
                    if (window.__reactMountError) {
                        var app = document.getElementById('app');
                        if (app) {
                            app.innerHTML = '<div style="padding: 20px; font-family: sans-serif; max-width: 600px; margin: 20px auto;">' +
                                '<h2 style="color: #c00;">React failed to load</h2>' +
                                '<pre style="background: #f5f5f5; padding: 12px; overflow: auto; font-size: 12px;">' + window.__reactMountError + '</pre>' +
                                '<p>Fix the error above and refresh the page.</p></div>';
                        }
                    }
                }
            }, 5000);
        });
    </script>
</body>
</html>
