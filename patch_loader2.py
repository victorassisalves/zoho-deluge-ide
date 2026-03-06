import re

loader_file = "app/loader.js"
with open(loader_file, "r") as f:
    content = f.read()

# Let's write the most compatible Monaco worker setup for MV3:
# We just return the worker directly initialized with the extension URL.
fixed_monaco_env = """
window.MonacoEnvironment = {
    getWorker: function (workerId, label) {
        // MV3 CSP safe way: return a direct Worker from the local extension URL.
        // This avoids the 'blob:' CSP error and the 'importScripts' error.
        const url = chrome.runtime.getURL('assets/monaco-editor/min/vs/assets/editor.worker-Be8ye1pW.js');
        return new Worker(url);
    }
};
"""

content = re.sub(r"window\.MonacoEnvironment\s*=\s*\{[\s\S]*?\};\n", fixed_monaco_env, content)
with open(loader_file, "w") as f:
    f.write(content)

print("Patched loader.js with direct worker")
