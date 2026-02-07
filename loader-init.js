if (window.location.search.includes("mode=sidepanel") || window.location.hash.includes("sidepanel")) {
    document.documentElement.classList.add("sidepanel-mode");
}

/**
 * Monaco Loader Initialization
 */

console.log('[ZohoIDE] Loader starting...');

// Set up Monaco Environment for Chrome Extension
window.MonacoEnvironment = {
    getWorkerUrl: function (workerId, label) {
        const workerPath = 'assets/monaco-editor/min/vs/assets/editor.worker-Be8ye1pW.js';
        const workerUrl = chrome.runtime.getURL(workerPath);

        // Using a Blob URL is generally more reliable than a data URL in extensions
        const blob = new Blob([
            `self.MonacoEnvironment = { baseUrl: '${chrome.runtime.getURL('assets/monaco-editor/min/vs/')}' };
             importScripts('${workerUrl}');`
        ], { type: 'application/javascript' });

        return URL.createObjectURL(blob);
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

        // Register language immediately if possible
        if (typeof registerDelugeLanguage === 'function') {
            registerDelugeLanguage();
        }

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
