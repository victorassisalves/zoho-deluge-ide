const fs = require('fs');

let code = fs.readFileSync('app/loader.js', 'utf8');

const replacement = `
window.MonacoEnvironment = {
    getWorker: function (moduleId, label) {
        // Return a new Worker directly pointing to the JS file
        // This avoids blob: URL creation which triggers MV3 CSP errors
        return new Worker(chrome.runtime.getURL('assets/monaco-editor/min/vs/assets/editor.worker-Be8ye1pW.js'));
    }
};
`;

code = code.replace(/window\.MonacoEnvironment = \{[\s\S]*?\};/, replacement);
fs.writeFileSync('app/loader.js', code);
console.log('Patched loader.js to use new Worker() instead of getWorkerUrl');
