loader_file = "app/loader.js"
with open(loader_file, "r") as f:
    content = f.read()

# Fix the dummy worker blob approach.
# Creating a dummy Worker using a Blob object URL STILL throws an error inside the Monaco internals
# or triggers a CSP policy violation if the parent page enforces strict 'worker-src'.
# The only 100% foolproof way to instruct Monaco to fallback to the main thread immediately
# without ANY NetworkError is to intentionally throw a synchronous error when getWorker() is invoked,
# or return a Promise that rejects (which `getWorker` shouldn't be), or just return a dummy proxy.
# Wait, if we return undefined in `getWorker`, it falls back to `getWorkerUrl` and tries to load the default blob.
# Let's provide an empty worker object that implements `postMessage` and `terminate`, so Monaco thinks it loaded but timeouts, or we throw directly inside getWorker.

# Let's see what Monaco does if getWorker throws an error: it catches it and falls back to main thread.
# Actually, the problem was that `importScripts` failed when we returned the local URL because the worker file *contained* importScripts.
# Let's just create a dummy worker file in the codebase instead of inline blob, OR throw an error.
# The simplest approach is setting window.MonacoEnvironment = { getWorker: function() { throw new Error('Force main thread fallback'); } }
new_monaco_env = """
window.MonacoEnvironment = {
    getWorker: function (workerId, label) {
        // MV3 CSP safe way: force immediate main-thread fallback.
        // Returning a dummy blob or local file URL triggers an 'importScripts' NetworkError
        // inside the worker scope, crashing the extension context.
        // Throwing an error here causes Monaco's internal wrapper to catch it
        // and safely fallback to the main thread without browser-level exceptions.
        throw new Error('Forcing Monaco to run in the main thread due to Extension CSP.');
    }
};
"""

# Let's replace the whole block carefully
import re
content = re.sub(r"window\.MonacoEnvironment\s*=\s*\{[\s\S]*?\};\n", new_monaco_env, content)
with open(loader_file, "w") as f:
    f.write(content)
print("Patched loader")
