const fs = require('fs');
let code = fs.readFileSync('app/loader.js', 'utf8');

const fix = `
window.MonacoEnvironment = {
    // Use getWorker instead of getWorkerUrl to bypass the Blob creation
    getWorker: function (moduleId, label) {
        // Construct the direct local path to the worker file.
        // Depending on where your loader file is, adjust the relative path
        const workerUrl = new URL('../assets/monaco-editor/min/vs/assets/editor.worker-Be8ye1pW.js', import.meta.url).href;
        return new Worker(workerUrl);
    }
};
`;

code = code.replace(/window\.MonacoEnvironment = \{[\s\S]*?\};/, fix);
fs.writeFileSync('app/loader.js', code);
console.log("Patched loader.js to perfectly match the user's explicit instructions");
