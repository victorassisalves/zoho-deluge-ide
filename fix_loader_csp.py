import re

loader_file = "app/loader.js"
with open(loader_file, "r") as f:
    content = f.read()

# Replace the worker logic with the fail-safe MV3 trick
# If we provide a worker that intentionally throws an error, the browser engine (V8)
# will throw it into the unhandled exception stack *if* the worker initialization is asynchronous.
# But Monaco expects `getWorker` to return a `Worker` instance immediately.
# If we throw a synchronous error inside `getWorker`, Monaco catches it instantly.
# But you mentioned "older version of Monaco handles it by attempting to instantiate the fallback blob".
# The ultimate solution for this in MV3 without altering `manifest.json` is:
# `window.MonacoEnvironment = { getWorkerUrl: function() { return ''; } };`
# This causes `new Worker('')` which throws `DOMException` instantly on construction.
# Monaco's try-catch catches the DOMException and falls back securely to the main thread.

new_monaco_env = """
window.MonacoEnvironment = {
    getWorkerUrl: function(workerId, label) {
        // MV3 CSP safe way: force Monaco to fail worker instantiation instantly.
        // Returning an empty string causes `new Worker('')` to throw a DOMException
        // synchronously. Monaco's internal wrapper catches this DOMException
        // and falls back to main-thread execution gracefully.
        return '';
    }
};
"""

content = re.sub(r"window\.MonacoEnvironment\s*=\s*\{[\s\S]*?\};\n", new_monaco_env, content)

with open(loader_file, "w") as f:
    f.write(content)

print("Patched loader.js CSP fallback")
