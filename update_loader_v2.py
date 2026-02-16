content = """if (window.location.search.includes("mode=sidepanel") || window.location.hash.includes("sidepanel")) {
    document.documentElement.classList.add("sidepanel-mode");
}

console.log('[ZohoIDE] Loader starting...');

window.MonacoEnvironment = {
    getWorkerUrl: function (workerId, label) {
        return chrome.runtime.getURL('assets/monaco-editor/min/vs/assets/editor.worker-Be8ye1pW.js');
    }
};

require.config({"""

new_block = """if (window.location.search.includes("mode=sidepanel") || window.location.hash.includes("sidepanel")) {
    document.documentElement.classList.add("sidepanel-mode");
}

console.log('[ZohoIDE] Loader starting...');

window.MonacoEnvironment = {
    getWorker: function (workerId, label) {
        const url = chrome.runtime.getURL('assets/monaco-editor/min/vs/assets/editor.worker-Be8ye1pW.js');
        return new Worker(url);
    }
};

require.config({"""

with open('loader-init.js', 'r') as f:
    full_content = f.read()

# Replace the block
if "window.MonacoEnvironment" in full_content:
    # Find the start and end of the block to replace
    start = full_content.find("window.MonacoEnvironment")
    end = full_content.find("require.config")

    # Construct the new content manually to avoid whitespace issues if possible
    # But since I have the exact content above, let's try direct replacement of the known block
    # It seems risky if whitespace differs.

    # Let's try to match loosely.
    import re
    pattern = r"window\.MonacoEnvironment\s*=\s*\{[\s\S]+?\};"
    replacement = """window.MonacoEnvironment = {
    getWorker: function (workerId, label) {
        const url = chrome.runtime.getURL('assets/monaco-editor/min/vs/assets/editor.worker-Be8ye1pW.js');
        return new Worker(url);
    }
};"""

    new_full_content = re.sub(pattern, replacement, full_content, count=1)

    with open('loader-init.js', 'w') as f:
        f.write(new_full_content)
else:
    print("Could not find window.MonacoEnvironment block")
