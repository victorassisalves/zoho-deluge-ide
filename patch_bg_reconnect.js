const fs = require('fs');

let code = fs.readFileSync('background.js', 'utf8');

// The issue is that the connection state (`contextHash`) in the `bridge.js` is lost when the Zoho tab reloads.
// Also, if the IDE reloads, it needs to re-establish the `contextHash` to the existing `chromeTabId`.
//
// Let's add a `linkedTabs` map in `background.js`:
// `const linkedTabs = new Map(); // tabId -> contextHash`
//
// When `LINK_FILE_TO_TAB` happens:
// `linkedTabs.set(targetTabId, fileId);`
//
// Listen to `chrome.tabs.onUpdated`:
// If `changeInfo.status === 'complete'` and `linkedTabs.has(tabId)`:
// Re-send `SET_CONTEXT_HASH` to the tab!

const reconnectLogic = `
const linkedTabs = new Map(); // tabId -> contextHash

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && linkedTabs.has(tabId) && isZohoUrl(tab.url)) {
        // Tab reloaded, re-establish the connection context in the bridge
        const contextHash = linkedTabs.get(tabId);
        setTimeout(() => {
            chrome.tabs.sendMessage(tabId, { action: 'SET_CONTEXT_HASH', contextHash: contextHash });
        }, 1000); // Wait for bridge injection
    }
});

chrome.tabs.onRemoved.addListener((tabId) => {
    if (linkedTabs.has(tabId)) {
        const fileId = linkedTabs.get(tabId);
        linkedTabs.delete(tabId);
        // Broadcast disconnection
        chrome.runtime.sendMessage({ action: 'ZOHO_TAB_DISCONNECTED', contextHash: fileId });
    }
});
`;

if (!code.includes("const linkedTabs = new Map();")) {
    code = code.replace("function isZohoUrl(url) {", reconnectLogic + "\nfunction isZohoUrl(url) {");
    fs.writeFileSync('background.js', code);
    console.log("Added linkedTabs caching and onUpdated reconnect logic");
} else {
    console.log("Already added");
}
