import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read manifest to get actual asset paths
const manifestPath = path.join(__dirname, '..', 'public', 'build', 'manifest.json');
let cssPath = '';
let jsPath = '';

if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    // Paths: root-relative only (Vercel outputDirectory is public/build, so root = /, no /build prefix)
    if (manifest['resources/css/app.css']) {
        cssPath = `/${manifest['resources/css/app.css'].file}`;
    }
    if (manifest['resources/js/main.jsx']) {
        jsPath = `/${manifest['resources/js/main.jsx'].file}`;
    } else if (manifest['resources/js/app.jsx']) {
        jsPath = `/${manifest['resources/js/app.jsx'].file}`;
    }
}

if (!jsPath) {
    console.error('create-index.js: No JS entry found in manifest. Build may be broken.');
    process.exit(1);
}

// Create index.html for Vercel deployment
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Connectly</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet">
    ${cssPath ? `<link rel="stylesheet" href="${cssPath}">` : ''}
</head>
<body>
    <div id="app">
        <div style="padding: 20px; text-align: center;">
            <p>Loading Connectly...</p>
            <p style="font-size: 12px; color: #666;">If this message persists, check the browser console for errors.</p>
        </div>
    </div>
    ${jsPath ? `<script type="module" src="${jsPath}"></script>` : ''}
</body>
</html>`;

// Write to public/build/index.html
const buildDir = path.join(__dirname, '..', 'public', 'build');
if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
}
fs.writeFileSync(path.join(buildDir, 'index.html'), indexHtml);
console.log('Created index.html in public/build');
