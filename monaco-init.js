// monaco-init.js
// Configures Monaco Environment before any other scripts load to ensure CSP compliance.

console.log("[ZohoIDE] Initializing Monaco Environment...");

window.MonacoEnvironment = {
    // Force Monaco to use physical worker files instead of Blob workers (CSP restriction in MV3)
    getWorker: function (moduleId, label) {
        console.log("[ZohoIDE] Creating worker for:", label);

        const basePath = "assets/monaco-editor/min/vs/assets/";
        let workerFilename = "editor.worker-Be8ye1pW.js"; // Default

        if (label === "json") {
            workerFilename = "json.worker-DKiEKt88.js";
        } else if (label === "css" || label === "scss" || label === "less") {
            workerFilename = "css.worker-HnVq6Ewq.js";
        } else if (label === "html" || label === "handlebars" || label === "razor") {
            workerFilename = "html.worker-B51mlPHg.js";
        } else if (label === "typescript" || label === "javascript") {
            workerFilename = "ts.worker-CMbG-7ft.js";
        }

        const workerUrl = chrome.runtime.getURL(basePath + workerFilename);
        console.log("[ZohoIDE] Worker URL:", workerUrl);
        return new Worker(workerUrl);
    }
};
