const fs = require('fs');

let code = fs.readFileSync('app/loader.js', 'utf8');

const fix = `
window.MonacoEnvironment = {
    getWorkerUrl: function (moduleId, label) {
        // Return a RELATIVE URL.
        // If we return an absolute chrome-extension:// URL, Monaco thinks it is cross-origin
        // and tries to wrap it in a blob with importScripts, which violates MV3 CSP.
        return '../assets/monaco-editor/min/vs/assets/editor.worker-Be8ye1pW.js';
    }
};
`;

code = code.replace(/window\.MonacoEnvironment = \{[\s\S]*?\};/, fix);

fs.writeFileSync('app/loader.js', code);
console.log("Patched loader.js with relative getWorkerUrl");
