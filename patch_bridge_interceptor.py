import re

bridge_file = "extension/host/bridge/main.js"
with open(bridge_file, "r") as f:
    content = f.read()

# Append interceptor logic at the end
interceptor_code = """

// --- Network Payload Fingerprinting ---
function inspectPayload(jsonText, url) {
    if (!jsonText || jsonText.length < 10) return;
    try {
        const json = JSON.parse(jsonText);

        // 1. The Creator Metadata Fingerprint
        if (json.apps && Object.keys(json.apps).length > 0) {
            const firstAppKey = Object.keys(json.apps)[0];
            if (json.apps[firstAppKey].forms) {
                console.log('[ZohoIDE] Found Creator Metadata Payload!');
                window.dispatchEvent(new CustomEvent('ZOHO_IDE_FROM_PAGE', {
                    detail: {
                        eventId: 'intercept_' + Date.now(),
                        action: 'METADATA_INTERCEPTED',
                        response: {
                            product: 'creator',
                            appKey: firstAppKey,
                            schema: json.apps[firstAppKey]
                        }
                    }
                }));
                return;
            }
        }

        // 2. The CRM Metadata Fingerprint (For future-proofing)
        if (json.functions && Array.isArray(json.functions) && json.functions.length > 0 && json.functions[0].workflow) {
            console.log('[ZohoIDE] Found CRM Metadata Payload!');
            window.dispatchEvent(new CustomEvent('ZOHO_IDE_FROM_PAGE', {
                detail: {
                    eventId: 'intercept_' + Date.now(),
                    action: 'METADATA_INTERCEPTED',
                    response: {
                        product: 'crm',
                        schema: json.functions
                    }
                }
            }));
            return;
        }
    } catch (e) {
        // Ignore JSON parse errors for non-JSON payloads
    }
}

// Intercept window.fetch
const originalFetch = window.fetch;
window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    // Clone response so we don't consume the stream needed by the page
    const clonedResponse = response.clone();
    clonedResponse.text().then(text => {
        const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url ? args[0].url : '');
        inspectPayload(text, url);
    }).catch(e => {});
    return response;
};

// Intercept XMLHttpRequest
const originalXHR = window.XMLHttpRequest;
window.XMLHttpRequest = function() {
    const xhr = new originalXHR();
    const originalOpen = xhr.open;
    let requestUrl = '';

    xhr.open = function(...args) {
        requestUrl = args[1];
        originalOpen.apply(this, args);
    };

    xhr.addEventListener('load', function() {
        if (xhr.responseText) {
            inspectPayload(xhr.responseText, requestUrl);
        }
    });

    return xhr;
};
"""

if "inspectPayload" not in content:
    with open(bridge_file, "a") as f:
        f.write(interceptor_code)
    print("Patched main.js with interceptor")
else:
    print("Already patched")
