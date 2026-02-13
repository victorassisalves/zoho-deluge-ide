if (window.location.search.includes("mode=sidepanel") || window.location.hash.includes("sidepanel")) {
    document.documentElement.classList.add("sidepanel-mode");
}

console.log("[ZohoIDE] Loader starting...");

window.MonacoEnvironment = {
    getWorker: function (workerId, label) {
        // Base path to your assets
        const basePath = 'assets/monaco-editor/min/vs/assets/';

        let workerFilename = 'editor.worker-Be8ye1pW.js'; // Default worker

        // Select specific worker based on language
        if (label === 'json') {
            workerFilename = 'json.worker-DKiEKt88.js';
        } else if (label === 'css' || label === 'scss' || label === 'less') {
            workerFilename = 'css.worker-HnVq6Ewq.js';
        } else if (label === 'html' || label === 'handlebars' || label === 'razor') {
            workerFilename = 'html.worker-B51mlPHg.js';
        } else if (label === 'typescript' || label === 'javascript') {
            workerFilename = 'ts.worker-CMbG-7ft.js';
        }

        // Return the physical worker instance
        const workerUrl = chrome.runtime.getURL(basePath + workerFilename);
        console.log("[ZohoIDE] Creating Worker:", workerUrl);
        return new Worker(workerUrl);
    }
};

require.config({
    paths: { "vs": "assets/monaco-editor/min/vs" }
});

function loadScript(src, isModule = false) {
    return new Promise((resolve, reject) => {
        console.log("[ZohoIDE] Loading script:", src);
        var script = document.createElement("script");
        script.src = src;
        if (isModule) script.type = "module";
        script.onload = () => resolve();
        script.onerror = (e) => reject(e);
        document.body.appendChild(script);
    });
}

require(["vs/editor/editor.main"], async function() {
    console.log("[ZohoIDE] Monaco Core loaded.");

    try {
        const originalDefine = window.define;
        window.define = undefined;

        await loadScript("assets/firebase-app-compat.js");
        await loadScript("assets/firebase-auth-compat.js");
        await loadScript("assets/firebase-firestore-compat.js");

        // Load Dexie as global while define is hidden (even if it's ESM, it might set window.Dexie if loaded as script, but we are using module import in db.js now. However, legacy parts might rely on it?)
        // Wait, db.js uses ESM import from assets/dexie.js.
        // We do NOT need to load it here globally if we use ESM everywhere.
        // BUT, since we have mixed environment, let's just ensure imports work.
        // We downloaded dexie.js (ESM). It won't set window.Dexie automatically if loaded as module.
        // But src/core/db.js imports it. So we are good there.

        window.define = originalDefine;

        try {
            await loadScript("firebase-config.js");
        } catch (e) {
            console.error("[ZohoIDE] Config Missing:", e);
            document.body.innerHTML = "<div style='display:flex;justify-content:center;align-items:center;height:100vh;background:#1e1e1e;color:#fff;font-family:sans-serif;text-align:center;'>" +
                "<div><h1>Configuration Missing</h1>" +
                "<p>Please create <code>firebase-config.js</code> in the extension root.</p>" +
                "<p>Copy <code>firebase-config.example.js</code> and add your Firebase credentials.</p>" +
                "<p>See README.md for details.</p></div></div>";
            throw new Error("Configuration missing");
        }
        await loadScript("cloud-service.js");
        await loadScript("cloud-ui.js");

        console.log("[ZohoIDE] Firebase initialized.");

        // Load the new Modular Main Entry Point
        await loadScript("src/main.js", true);

        // Load Legacy Helper Scripts (that rely on window.editor or similar)
        await loadScript("deluge-lang.js");
        await loadScript("snippet_logic.js");
        await loadScript("api_data.js");

        console.log("[ZohoIDE] Modular logic loaded.");

    } catch (err) {
        console.error("[ZohoIDE] Initialization Error:", err);
    }
});
