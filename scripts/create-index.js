import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    INITIAL_SKELETON_STYLE_TAG,
    INITIAL_THEME_SCRIPT,
    INITIAL_VARIANT_SCRIPT,
    INITIAL_STUCK_SCRIPT,
    getInitialSkeletonInnerHtml,
} from './initial-skeleton-template.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read manifest to get actual asset paths
const manifestPath = path.join(__dirname, '..', 'public', 'build', 'manifest.json');
let cssPath = '';
let jsPath = '';

// Vercel outputDirectory is public/build, so deployed root = /. Paths must be /assets/... never /build/assets/
function toRootPath(file) {
    const p = file.replace(/^\/+/, '').replace(/^build\//, '');
    return '/' + p;
}

if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    if (manifest['resources/css/app.css']) {
        cssPath = toRootPath(manifest['resources/css/app.css'].file);
    }
    if (manifest['resources/js/main.jsx']) {
        jsPath = toRootPath(manifest['resources/js/main.jsx'].file);
    } else if (manifest['resources/js/app.jsx']) {
        jsPath = toRootPath(manifest['resources/js/app.jsx'].file);
    }
}

if (!jsPath) {
    console.error('create-index.js: No JS entry found in manifest. Build may be broken.');
    process.exit(1);
}

const appInnerHtml = getInitialSkeletonInnerHtml({ initialAdminShell: false });

// Create index.html for Vercel deployment.
// Vercel root = public/build, so asset URLs must be /assets/... never /build/assets/
const indexHtmlRaw = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Connectly</title>
    ${INITIAL_THEME_SCRIPT}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet">
    ${cssPath ? `<link rel="stylesheet" href="${cssPath}">` : ''}
    ${INITIAL_SKELETON_STYLE_TAG}
</head>
<body>
    <div id="app">
        ${appInnerHtml}
    </div>
    ${INITIAL_VARIANT_SCRIPT}
    ${INITIAL_STUCK_SCRIPT}
    ${jsPath ? `<script type="module" src="${jsPath}"></script>` : ''}
</body>
</html>`;

// Ensure no /build/ in asset URLs (Vercel 404 otherwise)
const indexHtml = indexHtmlRaw
    .replace(/\bhref="\/build\//g, 'href="/')
    .replace(/\bsrc="\/build\//g, 'src="/');

// Write to public/build/index.html
const buildDir = path.join(__dirname, '..', 'public', 'build');
if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
}
fs.writeFileSync(path.join(buildDir, 'index.html'), indexHtml);
console.log('Created index.html in public/build');

// Rewrite /build/ -> / in built JS and CSS so Vercel (root = public/build) serves assets at /assets/...
const assetsDir = path.join(buildDir, 'assets');
if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir);
    for (const name of files) {
        if (!/\.(js|css)$/.test(name)) continue;
        const filePath = path.join(assetsDir, name);
        let content = fs.readFileSync(filePath, 'utf8');
        const next = content.replace(/\/build\/assets\//g, '/assets/').replace(/\/build\//g, '/');
        if (next !== content) {
            fs.writeFileSync(filePath, next);
            console.log('Rewrote /build/ -> / in', name);
        }
    }
}
