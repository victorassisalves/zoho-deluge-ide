import re

# Adding a content_security_policy to the manifest for the extension pages
manifest_file = "manifest.json"
with open(manifest_file, "r") as f:
    content = f.read()

# We need to add "content_security_policy": { "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'" }
# But wait, we can just allow the worker without throwing a NetworkError by adding the worker file to `content_security_policy`?
# No, MV3 CSP requires workers to be loaded via `chrome-extension://...` URL directly or Blob, but Blob's importScripts is restricted.
# Let's check how Monaco is loaded.
