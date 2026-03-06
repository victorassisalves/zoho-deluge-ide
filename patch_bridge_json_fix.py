import re

bridge_file = "extension/host/bridge/main.js"
with open(bridge_file, "r") as f:
    content = f.read()

# Replace the inspectPayload function to have better validation
fixed_inspect_payload = """
// --- Network Payload Fingerprinting ---
function inspectPayload(jsonText, url) {
    if (!jsonText || typeof jsonText !== 'string' || jsonText === '[object Object]') return;
    if (jsonText.length < 10) return;
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
"""

content = re.sub(r"// --- Network Payload Fingerprinting ---\nfunction inspectPayload.*?}\n}\n", fixed_inspect_payload, content, flags=re.DOTALL)
with open(bridge_file, "w") as f:
    f.write(content)

print("Fixed JSON parsing in bridge")
