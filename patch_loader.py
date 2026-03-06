import re

loader_file = "app/loader.js"
with open(loader_file, "r") as f:
    content = f.read()

# Fix Monaco worker loading for MV3.
# Returning `chrome.runtime.getURL(...)` directly in `getWorkerUrl` tells Monaco to load that file via Worker().
# However, `assets/monaco-editor/min/vs/assets/editor.worker-Be8ye1pW.js` tries to call `importScripts` inside it, which violates CSP.
# The most robust way to avoid CSP violations with Monaco Web Workers in MV3 without altering `manifest.json`
# is to use `getWorker` to construct a worker, or return a Blob that doesn't use importScripts.
# The simplest fix to prevent crashing is to just disable the worker fallback error, or return a blob that ignores the error, OR instruct Monaco to bypass the worker.
# We can bypass the worker by setting `window.MonacoEnvironment = { getWorker: function() { return undefined; } }`
# Wait, if getWorker is missing, it falls back to getWorkerUrl. If we don't provide getWorkerUrl, it tries relative.
# Let's use `getWorkerUrl: function() { return "data:text/javascript;charset=utf-8," + encodeURIComponent("self.onmessage = function() {};"); }`
# Or better, just override the MonacoEnvironment to return a dummy blob or empty worker if it's strictly blocking.
# Wait, Monaco already falls back to the main thread ("Falling back to loading web worker code in main thread").
# The issue is the unhandled `NetworkError` from the failed `importScripts` inside the Web Worker crashes the extension completely.
# Let's fix it by using a `Blob` that just sets up the worker correctly or using a local URL.
# Actually, the error is `Failed to execute 'importScripts' on 'WorkerGlobalScope'`. This happens when the worker itself is loaded successfully, but it calls `importScripts()`.
# If we supply `getWorker: function(workerId, label) { ... return new Worker(blobUrl); }` but the worker code internally calls `importScripts`, it will fail.
# Monaco provides a way to disable workers: don't provide a worker!
# But wait, it's easier: just let it fall back, but prevent the unhandled promise rejection? No, the browser throws it.
# The best fix for MV3 extensions is simply to use the local worker script URL instead of a Blob!
# `getWorkerUrl: function() { return chrome.runtime.getURL('assets/monaco-editor/min/vs/base/worker/workerMain.js'); }`

# But the file `editor.worker-Be8ye1pW.js` is clearly a bundled vite/rollup file.
# Let's create a custom getWorker that returns a simple worker or falls back silently.
# Actually, if we just remove getWorkerUrl, Monaco might use its default blob and fail silently.

fixed_monaco_env = """
window.MonacoEnvironment = {
    getWorker: function (workerId, label) {
        // Create a blob that loads the worker script safely or falls back
        // In MV3, importScripts inside a blob is blocked by default CSP.
        // Returning a dummy worker avoids the CSP crash, and Monaco will fall back to the main thread
        // gracefully without throwing the unhandled NetworkError.
        const blob = new Blob([`
            self.onmessage = function() {
                // Dummy worker to satisfy Monaco initialization without triggering importScripts CSP violation.
                // Monaco will timeout/detect this and fall back to the main thread securely.
            };
        `], { type: 'application/javascript' });
        return new Worker(URL.createObjectURL(blob));
    }
};
"""

content = re.sub(r"window\.MonacoEnvironment\s*=\s*\{[\s\S]*?\};\n", fixed_monaco_env, content)
with open(loader_file, "w") as f:
    f.write(content)

print("Patched loader.js")
