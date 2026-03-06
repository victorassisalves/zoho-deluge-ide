const fs = require('fs');

let code = fs.readFileSync('background.js', 'utf8');

// The user error also showed: "background.js:1 Uncaught (in promise) Error: Could not establish connection. Receiving end does not exist."
// This happens when background.js does chrome.tabs.sendMessage to a tab that DOES NOT have a listener (like the extension IDE tab on reload, or a Zoho tab before the content script is injected).
// In background.js, where do we send messages?
// 1. In `findZohoTab`, PINGing tabs. We catch errors.
// 2. In `SCHEMA_CAPTURED` broadcast loop!

const fixBroadcastCode = `
    // Route SCHEMA_CAPTURED to all extension tabs (IDE)
    if (request.action === 'SCHEMA_CAPTURED') {
        chrome.tabs.query({ url: chrome.runtime.getURL('*') }, (tabs) => {
            for (let tab of tabs) {
                chrome.tabs.sendMessage(tab.id, request, () => {
                    // Catch the "Receiving end does not exist" error silently
                    let _ = chrome.runtime.lastError;
                });
            }
        });
        // We also allow it to be processed here or just let it fall through
        return true;
    }
`;

code = code.replace(/\/\/ Route SCHEMA_CAPTURED to all extension tabs \(IDE\)[\s\S]*?return true;\s*\}/, fixBroadcastCode);

fs.writeFileSync('background.js', code);
console.log("Patched background.js broadcast loop to suppress Receiving End error");
