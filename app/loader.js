if (window.location.search.includes("mode=sidepanel") || window.location.hash.includes("sidepanel")) {
    document.documentElement.classList.add("sidepanel-mode");
}

console.log('[ZohoIDE] Loader starting...');

window.MonacoEnvironment = {
    getWorkerUrl: function (workerId, label) {
        // Absolute URL, safe to use from anywhere
        return chrome.runtime.getURL('assets/monaco-editor/min/vs/assets/editor.worker-Be8ye1pW.js');
    }
};

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

        // Protocol - Shared
        // Can we load it? It's an ES module export.
        // We can import it in editor-controller.js if that is a module.
        // Or we can try to load it here?
        // loadScript('../shared/protocol.js', true);
        // But main logic is in editor-controller.js which should be a module?
        // ide.js was a script. ide.html had it as src="ide.js".
        // Now it's app/core/editor-controller.js.
        // If we want to use imports in it, we should load it as module.
        // Let's assume we load it as module.

        // Main Logic
        // src/main.js - what is this? It was loaded as module.
        await loadScript('../src/main.js', true);

        // Core / Utils
        await loadScript('../deluge-lang.js');

        // Modules
        await loadScript('modules/snippets/snippet-manager.js'); // Was snippet_logic.js
        await loadScript('../api_data.js');

        // The Controller
        // ide.js -> app/core/editor-controller.js
        // If we want to use ES modules (import MSG), we must load as module.
        // Old ide.js was NOT a module.
        // But the plan says "Refactor editor-controller.js to use bus.js".
        // bus.js will likely be a module.
        // So editor-controller.js should be a module.
        await loadScript('core/editor-controller.js', true);

        // We also need to load bus.js?
        // Or let editor-controller.js import it.
        // If editor-controller.js is a module, it can import bus.js.
        // We don't need to explicitly load bus.js here if it's imported.

        // Also zoho-runner.js (new service)
        // It will be imported by editor-controller.js or loaded?
        // If editor-controller.js imports it, we are good.

        console.log('[ZohoIDE] Modular logic loaded.');

    } catch (err) {
        console.error('[ZohoIDE] Initialization Error:', err);
    }
});
