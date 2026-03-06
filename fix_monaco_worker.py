import re
with open('app/loader.js', 'r') as f:
    content = f.read()

# Replace the worker logic to force main-thread fallback safely
old_worker = """window.MonacoEnvironment = {
    getWorker: function (workerId, label) {
        // MV3 CSP safe way: return a direct Worker from the local extension URL.
        // This avoids the 'blob:' CSP error and the 'importScripts' error.
        const url = chrome.runtime.getURL('assets/monaco-editor/min/vs/assets/editor.worker-Be8ye1pW.js');
        return new Worker(url);
    }
};"""

new_worker = """window.MonacoEnvironment = {
    getWorkerUrl: function(workerId, label) {
        // MV3 CSP safe way: return a dummy data blob that does nothing.
        // Monaco will attempt to load this, fail to find the worker methods,
        // and safely fallback to the main thread without throwing NetworkError
        // that crashes the extension.
        return `data:text/javascript;charset=utf-8,${encodeURIComponent("self.onmessage = function() {};")}`;
    }
};"""

content = content.replace(old_worker, new_worker)

with open('app/loader.js', 'w') as f:
    f.write(content)
