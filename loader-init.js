if (window.location.search.includes("mode=sidepanel") || window.location.hash.includes("sidepanel")) {
    document.documentElement.classList.add("sidepanel-mode");
}

console.log('[ZohoIDE] Loader starting...');

window.MonacoEnvironment = {
    // Force Monaco to run without Web Workers to bypass CSP issues
    staticSelf: true,
    getWorkerUrl: function (workerId, label) {
        // Points to the file, but staticSelf: true typically forces main thread execution
        // using the fallback logic. If Monaco attempts to create a worker and fails (which we ensure via CSP),
        // it will run on the main thread.
        return chrome.runtime.getURL('assets/monaco-editor/min/vs/assets/editor.worker-Be8ye1pW.js');
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
    console.log('[ZohoIDE] Monaco Core loaded in Main Thread.');

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

        // --- THE ZOMBIE KILL-SWITCH ---
        // COMMENT OUT OR REMOVE THESE UNTIL V1 IS STABLE
        /*
        await loadScript('deluge-lang.js');
        await loadScript('snippet_logic.js');
        await loadScript('api_data.js');
        await loadScript('ide.js');
        */

        console.log('[ZohoIDE] V1 Modular Framework Active.');

    } catch (err) {
        console.error('[ZohoIDE] Boot Error:', err);
    }
});
