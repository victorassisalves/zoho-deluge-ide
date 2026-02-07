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

function loadScript(src) {
    return new Promise((resolve, reject) => {
        var script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
    });
}

require(['vs/editor/editor.main'], async function() {
    console.log('[ZohoIDE] Monaco Core loaded.');

    try {
        // Temporarily disable AMD define to avoid conflicts with Firebase SDKs
        const originalDefine = window.define;
        window.define = undefined;

        // Load Firebase
        await loadScript('assets/firebase-app-compat.js');
        await loadScript('assets/firebase-auth-compat.js');
        await loadScript('assets/firebase-firestore-compat.js');
        await loadScript('firebase-config.js');
        await loadScript('cloud-service.js');
        await loadScript('cloud-ui.js');

        // Restore define
        window.define = originalDefine;
        console.log('[ZohoIDE] Firebase SDKs and Cloud UI loaded.');

        // Load Deluge Language
        await loadScript('deluge-lang.js');
        console.log('[ZohoIDE] deluge-lang.js loaded.');

        if (typeof registerDelugeLanguage === 'function') {
            registerDelugeLanguage();
        }

        // Load main IDE logic
        await loadScript('ide.js');
        console.log('[ZohoIDE] ide.js loaded.');

    } catch (err) {
        console.error('[ZohoIDE] Error loading scripts:', err);
    }
});
