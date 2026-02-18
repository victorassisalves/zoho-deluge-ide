if (window.location.search.includes("mode=sidepanel") || window.location.hash.includes("sidepanel")) {
    document.documentElement.classList.add("sidepanel-mode");
}

console.log('[ZohoIDE] Loader starting...');

window.MonacoEnvironment = {
    getWorkerUrl: function (workerId, label) {
        return chrome.runtime.getURL('assets/monaco-editor/min/vs/assets/editor.worker-Be8ye1pW.js');
    }
};

require.config({
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

        await loadScript('../assets/firebase-app-compat.js');
        await loadScript('../assets/firebase-auth-compat.js');
        await loadScript('../assets/firebase-firestore-compat.js');

        window.define = originalDefine;

        await loadScript('../firebase-config.js');
        await loadScript('services/firebase-store.js');
        await loadScript('ui/cloud-ui.js');

        console.log('[ZohoIDE] Firebase initialized.');

        await loadScript('../src/main.js', true);

        await loadScript('../deluge-lang.js');
        await loadScript('modules/snippets/snippet-manager.js');
        await loadScript('../api_data.js');

        // Modular Core
        await loadScript('core/bus.js', true);
        await loadScript('services/zoho-runner.js', true);
        await loadScript('core/editor-controller.js');

        console.log('[ZohoIDE] Modular logic loaded.');

    } catch (err) {
        console.error('[ZohoIDE] Initialization Error:', err);
    }
});
