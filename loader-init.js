if (window.location.search.includes("mode=sidepanel") || window.location.hash.includes("sidepanel")) {
    document.documentElement.classList.add("sidepanel-mode");
}

console.log('[ZohoIDE] Loader starting...');

window.MonacoEnvironment = {
    getWorker: async function (workerId, label) {
        const url = chrome.runtime.getURL('assets/monaco-editor/min/vs/assets/editor.worker-Be8ye1pW.js');
        try {
            const response = await fetch(url);
            const text = await response.text();
            const blob = new Blob([text], { type: 'application/javascript' });
            return new Worker(URL.createObjectURL(blob));
        } catch (e) {
            console.warn('[ZohoIDE] Worker fetch failed, falling back to URL:', e);
            return new Worker(url);
        }
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

        await loadScript('deluge-lang.js');
        await loadScript('snippet_logic.js');
        await loadScript('api_data.js');
        await loadScript('ide.js');

        console.log('[ZohoIDE] Monolithic logic loaded.');

    } catch (err) {
        console.error('[ZohoIDE] Initialization Error:', err);
    }
});
