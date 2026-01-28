const fs = require('fs');
const path = require('path');

// Read manifest to get actual asset paths
const manifestPath = path.join(__dirname, '..', 'public', 'build', 'manifest.json');
let cssPath = '';
let jsPath = '';

if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    if (manifest['resources/css/app.css']) {
        cssPath = `/build/${manifest['resources/css/app.css'].file}`;
    }
    if (manifest['resources/js/app.jsx']) {
        jsPath = `/build/${manifest['resources/js/app.jsx'].file}`;
    }
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
