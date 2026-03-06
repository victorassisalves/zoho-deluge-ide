import re

content_file = "extension/host/content.js"
with open(content_file, "r") as f:
    content = f.read()

# Add a listener for METADATA_INTERCEPTED from the bridge
relay_code = """
    // Listen for Metadata Interception
    window.addEventListener('ZOHO_IDE_FROM_PAGE', (event) => {
        const data = event.detail;
        if (data && data.action === 'METADATA_INTERCEPTED') {
            console.log('[ZohoIDE] Relay METADATA_INTERCEPTED to background');
            chrome.runtime.sendMessage({
                action: 'METADATA_INTERCEPTED',
                payload: data.response
            });
            // Also dispatch it to any listening IDE instances in standalone mode
            window.postMessage({
                type: 'METADATA_INTERCEPTED',
                payload: data.response
            }, '*');
        }
    });
"""

# Find a good place to inject this listener. Right after window.addEventListener('message', ...) seems fine,
# or just after the bridge interaction logic. Let's append it before the `injectSidePanel` function or at the bottom.

if "METADATA_INTERCEPTED" not in content:
    # Just append it inside the async IIFE before injectSidePanel
    content = content.replace("function injectSidePanel", relay_code + "\n    function injectSidePanel")
    with open(content_file, "w") as f:
        f.write(content)
    print("Patched content.js with METADATA_INTERCEPTED listener")
else:
    print("Already patched")
