/**
 * loader-init.js
 * The "Clean Slate" Bootstrapper
 * Strategy: Main-Thread Only, No External Dependencies (Firebase Removed)
 */

console.log('[ZohoIDE] Bootloader starting...');

// 1. Force Monaco to run on Main Thread
// This effectively disables the Web Worker requirement, bypassing CSP issues.
window.MonacoEnvironment = {
    getWorker: function (workerId, label) {
        return null;
    }
};

// 2. Configure RequireJS for Monaco
require.config({
    paths: { 'vs': chrome.runtime.getURL('assets/monaco-editor/min/vs') },
    waitTime: 60
});

// Helper: Load ES Module (Your V1 App)
function loadModule(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL(src);
        script.type = 'module';
        script.onload = resolve;
        script.onerror = (e) => reject(new Error(`Failed to load module: ${src}`));
        (document.head || document.documentElement).appendChild(script);
    });
}

// 3. Execute Boot Sequence
require(['vs/editor/editor.main'], async function() {
    console.log('[ZohoIDE] Monaco Editor Core Loaded.');

    try {
        // Load the Hexagonal Architecture Entry Point
        // We are NOT loading Firebase, cloud-service, or ide.js
        await loadModule('src/main.js');

        console.log('[ZohoIDE] V1 Structural Base Active.');

    } catch (err) {
        console.error('[ZohoIDE] Critical Boot Failure:', err);
    }
});
