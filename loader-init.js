if (window.location.search.includes("mode=sidepanel") || window.location.hash.includes("sidepanel")) {
    document.documentElement.classList.add("sidepanel-mode");
}

console.log('[ZohoIDE] Loader starting...');

window.MonacoEnvironment = {
    getWorkerUrl: function (moduleId, label) {
        // 🟢 FORCE Absolute Path using chrome.runtime.getURL
        // This resolves to: chrome-extension://[ID]/assets/monaco-editor/...
        return chrome.runtime.getURL('assets/monaco-editor/min/vs/assets/editor.worker-Be8ye1pW.js');
    },
    getWorker: function (workerId, label) {
        const url = chrome.runtime.getURL('assets/monaco-editor/min/vs/assets/editor.worker-Be8ye1pW.js');
        return new Worker(url, { type: 'module' });
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

        await loadScript('assets/firebase-app-compat.js');
        await loadScript('assets/firebase-auth-compat.js');
        await loadScript('assets/firebase-firestore-compat.js');

        window.define = originalDefine;

        await loadScript('firebase-config.js');
        await loadScript('cloud-service.js');
        await loadScript('cloud-ui.js');

        console.log('[ZohoIDE] Firebase initialized.');

        await loadScript('src/main.js', true);

        // 🟢 PREVENT ZOMBIE CONFLICT
        // Legacy scripts (ide.js, etc.) are disabled in favor of the new V1 Architecture.
        // await loadScript('deluge-lang.js');
        // await loadScript('snippet_logic.js');
        // await loadScript('api_data.js');
        // await loadScript('ide.js');

        console.log('[ZohoIDE] V1 Architecture loaded. Legacy disabled.');

    } catch (err) {
        console.error('[ZohoIDE] Initialization Error:', err);
    }
});
