if (window.location.search.includes("mode=sidepanel") || window.location.hash.includes("sidepanel")) {
    document.documentElement.classList.add("sidepanel-mode");
}

console.log('[ZohoIDE] Loader starting...');





// Freeze MonacoEnvironment so the Vite bundle cannot overwrite it with its Blob/importScripts implementation
Object.defineProperty(window, 'MonacoEnvironment', {
    value: {
        getWorker: function (moduleId, label) {
            // MV3 CSP safe way: return a dummy proxy.
            return {
                postMessage: function() {},
                addEventListener: function() {},
                removeEventListener: function() {},
                terminate: function() {}
            };
        }
    },
    writable: false,
    configurable: false
});

require.config({
    // Adjusted for app/index.html location (one level deep)
    paths: { 'vs': '../assets/monaco-editor/min/vs' }
});

function loadScript(src, isModule = false) {
    return new Promise((resolve, reject) => {
        console.log('[ZohoIDE] Loading script:', src);
        var script = document.createElement('script');
        script.src = src;
        if (isModule) script.type = 'module';
        script.onload = () => resolve();
        script.onerror = (e) => reject(e);
        document.body.appendChild(script);
    });
}

// Ensure UI is initialized first
async function boot() {
    try {
        console.log('[ZohoIDE] Initializing UI components...');
        // Dynamically import the UI initializer
        const uiModule = await import('./ui/index.js');
        uiModule.initializeUI();
        console.log('[ZohoIDE] UI components injected.');

        require(['vs/editor/editor.main'], async function() {
            console.log('[ZohoIDE] Monaco Core loaded.');

            try {
                const originalDefine = window.define;
                window.define = undefined;

                // Firebase - stored in assets (root relative to app/ is ../assets)
                await loadScript('../assets/firebase-app-compat.js');
                await loadScript('../assets/firebase-auth-compat.js');
                await loadScript('../assets/firebase-firestore-compat.js');

                window.define = originalDefine;

                // Configs - in root
                await loadScript('../firebase-config.js');

                // Services
                await loadScript('services/firebase-store.js'); // Was cloud-service.js
                await loadScript('../cloud-ui.js'); // Still in root? Yes, prompt didn't say move it.

                console.log('[ZohoIDE] Firebase initialized.');

                // Main Logic
                await loadScript('../src/main.js', true);

                // Core / Utils

                // Modules
                await loadScript('modules/snippets/snippet-manager.js');
                await loadScript('../api_data.js');
                await loadScript('../my_snippets.js');

                // The Controller (Client Logic)
                await loadScript('core/editor-controller.js', true);

                console.log('[ZohoIDE] Modular logic loaded.');

            } catch (err) {
                console.error('[ZohoIDE] Initialization Error:', err);
            }
        });
    } catch (err) {
        console.error('[ZohoIDE] Boot Error:', err);
    }
}

// Start boot sequence
boot();
