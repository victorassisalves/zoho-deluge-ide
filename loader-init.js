if (window.location.search.includes("mode=sidepanel") || window.location.hash.includes("sidepanel")) {
    document.documentElement.classList.add("sidepanel-mode");
}

console.log('[ZohoIDE] Loader starting...');

window.MonacoEnvironment = {
    getWorkerUrl: function (workerId, label) {
        // Force the correct absolute path from the extension root
        // UPDATED: Using the actual file found: assets/monaco-editor/min/vs/assets/editor.worker-Be8ye1pW.js
        const workerPath = 'assets/monaco-editor/min/vs/assets/editor.worker-Be8ye1pW.js';
        // Create a proxy worker via Data URI that imports the actual worker script.
        // This bypasses some path resolution issues and allows us to set the baseUrl.
        return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
            self.MonacoEnvironment = { baseUrl: '${chrome.runtime.getURL('assets/monaco-editor/min/vs/')}' };
            importScripts('${chrome.runtime.getURL(workerPath)}');
        `)}`;
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

        // DISABLE THE MONOLITH FOR NOW TO STOP CONFLICTS
        /*
        await loadScript('deluge-lang.js');
        await loadScript('snippet_logic.js');
        await loadScript('api_data.js');
        await loadScript('ide.js');
        */
        console.log('[ZohoIDE] V1 Modular logic loading...');

    } catch (err) {
        console.error('[ZohoIDE] Initialization Error:', err);
    }
});
