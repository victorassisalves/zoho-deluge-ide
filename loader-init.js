console.log('[ZohoIDE] Bootloader starting...');

// FORCE Main Thread execution.
// We provide a getWorker that returns a dummy worker if creating one fails,
// OR we return a dummy string URL if we want it to fail and fallback.
// But the cleanest way is to return the actual file path, let it fail CSP, and fall back.
// However, to stop the console error noise and ensure it works:
window.MonacoEnvironment = {
    getWorkerUrl: function (workerId, label) {
        return ''; // Return empty string to force fallback immediately?
    },
    getWorker: function(workerId, label) {
        console.log('[ZohoIDE] Monaco requested worker:', label);
        return null; // Returning null here forces main thread in standard Monaco
    }
};

require.config({
    paths: { 'vs': chrome.runtime.getURL('assets/monaco-editor/min/vs') },
    waitTime: 60
});

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

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL(src);
        script.onload = resolve;
        script.onerror = (e) => reject(new Error(`Failed to load ${src}`));
        (document.head || document.documentElement).appendChild(script);
    });
}

require(['vs/editor/editor.main'], async function() {
    console.log('[ZohoIDE] Monaco Editor Core Loaded.');

    try {
        await loadModule('src/main.js');
        console.log('[ZohoIDE] V1 Structural Base Active.');
    } catch (err) {
        console.error('[ZohoIDE] Critical Boot Failure:', err);
    }
});
