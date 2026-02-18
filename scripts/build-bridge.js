const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../extension/host/bridge');
const outFile = path.join(__dirname, '../extension/host/bridge.bundle.js');

const files = [
    'detectors.js',
    'scrapers.js',
    'actions/base-actions.js',
    'main.js'
];

let bundleContent = '(function() {\n';

files.forEach(file => {
    const filePath = path.join(srcDir, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');

        // Remove imports
        content = content.replace(/^import .*$/gm, '');

        // Remove exports
        content = content.replace(/^export /gm, '');

        bundleContent += `\n// --- ${file} ---\n`;
        bundleContent += content + '\n';
    } else {
        console.error(`File not found: ${filePath}`);
    }
});

bundleContent += '\n})();';

fs.writeFileSync(outFile, bundleContent);
console.log(`Bridge bundle created at ${outFile}`);
