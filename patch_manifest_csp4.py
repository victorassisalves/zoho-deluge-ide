import json

manifest_file = "manifest.json"
with open(manifest_file, "r") as f:
    manifest = json.load(f)

# Update CSP to allow standard worker execution if it's there
# But MV3 doesn't allow 'blob:' or 'data:' in worker-src usually.
# We'll stick to the dummy worker blob fallback in loader.js
# Wait, let's verify if `assets/monaco-editor/min/vs/assets/editor.worker-Be8ye1pW.js` actually exists.
# We can just return `new Worker(chrome.runtime.getURL('assets/monaco-editor/min/vs/assets/editor.worker-Be8ye1pW.js'))` directly!
