/**
 * Monaco Loader Initialization
 */

console.log('[ZohoIDE] Loader starting...');

// Set up Monaco Environment for Chrome Extension
window.MonacoEnvironment = {
    getWorkerUrl: function (workerId, label) {
        const baseUrl = chrome.runtime.getURL('assets/monaco-editor/min/vs');

        // Use a blob to bypass importScripts issues in some environments
        const workerCode = `
            self.MonacoEnvironment = {
                baseUrl: '${baseUrl}'
            };
            importScripts('${baseUrl}/assets/editor.worker-Be8ye1pW.js');
        `;

        // Alternatively, for specific languages:
        // if (label === 'json') return ...

        return 'data:text/javascript;charset=utf-8,' + encodeURIComponent(workerCode);
    }
};

require.config({
    paths: { 'vs': 'assets/monaco-editor/min/vs' }
});

require(['vs/editor/editor.main'], function() {
    console.log('[ZohoIDE] Monaco Core loaded.');

    // Load language definition
    var script = document.createElement('script');
    script.src = 'deluge-lang.js';
    script.onload = function() {
        console.log('[ZohoIDE] deluge-lang.js loaded.');

        // Load main IDE logic
        var ideScript = document.createElement('script');
        ideScript.src = 'ide.js';
        document.body.appendChild(ideScript);
    };
    script.onerror = function() {
        console.error('[ZohoIDE] Failed to load deluge-lang.js');
    };
    document.body.appendChild(script);
});
