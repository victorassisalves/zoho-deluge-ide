if (window.location.search.includes("mode=sidepanel") || window.location.hash.includes("sidepanel")) {
    document.documentElement.classList.add("sidepanel-mode");
}

console.log("[ZohoIDE] Loader starting...");

window.MonacoEnvironment = {
    // Use 'getWorker' (returns a Worker instance), NOT 'getWorkerUrl'
    getWorker: function (moduleId, label) {
        const basePath = "assets/monaco-editor/min/vs/assets/";

        // Select the correct worker file based on language
        let workerFilename = "editor.worker-Be8ye1pW.js"; // Default

        if (label === "json") {
            workerFilename = "json.worker-DKiEKt88.js";
        } else if (label === "css" || label === "scss" || label === "less") {
            workerFilename = "css.worker-HnVq6Ewq.js";
        } else if (label === "html" || label === "handlebars" || label === "razor") {
            workerFilename = "html.worker-B51mlPHg.js";
        } else if (label === "typescript" || label === "javascript") {
            workerFilename = "ts.worker-CMbG-7ft.js";
        }

        // Create the physical worker directly to bypass CSP Blob restrictions
        return new Worker(chrome.runtime.getURL(basePath + workerFilename));
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

        // Removed ide.js (Monolithic Logic)
        console.log("[ZohoIDE] Modular logic loaded.");

    } catch (err) {
        console.error("[ZohoIDE] Initialization Error:", err);
    }
});
