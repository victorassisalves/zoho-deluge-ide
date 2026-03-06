const fs = require('fs');

let backgroundCode = fs.readFileSync('background.js', 'utf8');

// Wait! If the standalone IDE tab is open, it might NOT receive `chrome.runtime.sendMessage` from `content.js` because
// the sender is the Zoho tab, and it only routes to the background script. Extension pages CAN listen to `chrome.runtime.onMessage`
// but it's much safer to have the background script explicitly forward it to the IDE tabs.
// Let's modify background.js to broadcast it explicitly.

const broadcastCode = `
    // Route SCHEMA_CAPTURED to all extension tabs (IDE)
    if (request.action === 'SCHEMA_CAPTURED') {
        chrome.tabs.query({ url: chrome.runtime.getURL('*') }, (tabs) => {
            for (let tab of tabs) {
                chrome.tabs.sendMessage(tab.id, request);
            }
        });
        // We also allow it to be processed here or just let it fall through
        return true;
    }
`;

if (!backgroundCode.includes("request.action === 'SCHEMA_CAPTURED'")) {
    backgroundCode = backgroundCode.replace(/chrome\.runtime\.onMessage\.addListener\(\(request, sender, sendResponse\) => \{/, "chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {\n" + broadcastCode);
    fs.writeFileSync('background.js', backgroundCode);
    console.log("Added SCHEMA_CAPTURED forwarding to background.js");
} else {
    console.log("Already added");
}
