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

function loadScript(src, isModule = false) {
    return new Promise((resolve, reject) => {
        console.log('[ZohoIDE] Loading script:', src);
        var script = document.createElement('script');
        script.src = src;
        if (isModule) script.type = 'module';
        script.onload = () => {
            console.log('[ZohoIDE] Loaded:', src);
            resolve();
        };
        script.onerror = (e) => {
            console.error('[ZohoIDE] Failed to load:', src, e);
            reject(e);
        };
        document.body.appendChild(script);
    });
}

// Initializing Monaco and dependencies
require(['vs/editor/editor.main'], async function() {
    console.log('[ZohoIDE] Monaco Core (AMD) loaded.');

    try {
        const originalDefine = window.define;
        window.define = undefined;

        await loadScript('assets/firebase-app-compat.js');
        await loadScript('assets/firebase-auth-compat.js');
        await loadScript('assets/firebase-firestore-compat.js');

        window.define = originalDefine;

        await loadScript('firebase-config.js');
        await loadScript('cloud-service.js');
        await loadScript('cloud-ui.js');

        console.log('[ZohoIDE] Firebase and Cloud UI initialized.');

        // Load Modular IDE (ES Modules)
        await loadScript('src/main.js', true);
        console.log('[ZohoIDE] src/main.js loaded.');

    } catch (err) {
        console.error('[ZohoIDE] Critical error during script initialization:', err);
    }
});
