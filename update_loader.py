import re

with open('loader-init.js', 'r') as f:
    content = f.read()

pattern = r"window\.MonacoEnvironment\s*=\s*\{[\s\S]*?getWorkerUrl[\s\S]*?return\s+chrome\.runtime\.getURL\('([^']+)'\);\s*[\s\S]*?\};"
replacement = r"""window.MonacoEnvironment = {
    getWorker: function (workerId, label) {
        const url = chrome.runtime.getURL('\1');
        return new Worker(url);
    }
};"""

new_content = re.sub(pattern, replacement, content)

with open('loader-init.js', 'w') as f:
    f.write(new_content)
