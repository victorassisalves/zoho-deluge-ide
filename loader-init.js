console.log('[ZohoIDE] Bootloader starting...');

// FORCE Main Thread execution.
// This disables Web Workers entirely, preventing CSP and Network errors.
window.MonacoEnvironment = {
    staticSelf: true
};

// Configure RequireJS
require.config({
    paths: { 'vs': chrome.runtime.getURL('assets/monaco-editor/min/vs') },
    waitTime: 60 // Wait 60s before timing out
});

// Helper to load ES Modules safely
function loadModule(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL(src);
        script.type = 'module';
        script.onload = resolve;
        script.onerror = (e) => reject(new Error(`Failed to load ${src}`));
        (document.head || document.documentElement).appendChild(script);
    });
}

// Helper to load Standard Scripts (Firebase, etc)
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL(src);
        script.onload = resolve;
        script.onerror = (e) => reject(new Error(`Failed to load ${src}`));
        (document.head || document.documentElement).appendChild(script);
    });
}

// THE BOOT SEQUENCE
require(['vs/editor/editor.main'], async function() {
    console.log('[ZohoIDE] Monaco Editor Core Loaded (Main Thread).');

    try {
        // 1. Initialize Firebase (if needed)
        // window.define = undefined; // Sometimes needed for non-AMD scripts
        await loadScript('assets/firebase-app-compat.js');
        await loadScript('assets/firebase-auth-compat.js');
        await loadScript('assets/firebase-firestore-compat.js');

        // await loadScript('firebase-config.js');

        // 2. Load the Hexagonal Architecture Entry Point
        await loadModule('src/main.js');

        console.log('[ZohoIDE] V1 Framework Active.');

    } catch (err) {
        console.error('[ZohoIDE] Critical Boot Failure:', err);
    }
});
