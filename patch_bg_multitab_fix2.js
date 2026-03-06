const fs = require('fs');

// In `app/services/zoho-runner.js`, `payload` has `targetContextHash` which is the `fileId`.
// In `background.js`, if `targetTabId` is NOT passed directly (which it isn't, because `ZohoRunner` only sends `targetContextHash`),
// `background.js` uses `findZohoTab(callback, targetContextHash)`.
// `findZohoTab` PINGs all Zoho tabs and looks for `response.context.contextHash === targetContextHash`.
// Does the Zoho tab return `response.context.contextHash`?
// Yes, when it is linked, it sets its context hash.

// Wait, what if multiple tabs are linked to different files?
// `findZohoTab` pings all of them. The one that replies with the matching `contextHash` is returned!
// This is exactly how multi-tab is supposed to work!
// BUT look at `background.js`:
// `const isPull = request.action === 'GET_ZOHO_CODE' || request.action === 'editor:pull' || request.action === 'editor:init';`
// For relayActions, it uses:
// `if (targetTabId) handleAction(targetTabId); else findZohoTab(...)`

// BUT wait! In `findZohoTab`:
/*
        if (targetContextHash) {
            // Ping tabs to find matching context
            let pendingChecks = zohoTabs.length;
            let foundTab = null;

            if (pendingChecks === 0) return callback(null);

            const checkDone = () => {
                pendingChecks--;
                if (pendingChecks === 0 && !foundTab) {
                    callback(null); // Not found
                }
            };

            for (const tab of zohoTabs) {
                chrome.tabs.sendMessage(tab.id, { action: 'PING' }, (response) => {
                    // Ignore error
                    let _ = chrome.runtime.lastError;
                    if (response && response.context && response.context.contextHash === targetContextHash && !foundTab) {
                        foundTab = tab;
                        callback(tab);
                    }
                    checkDone();
                });
            }
            return;
        }
*/
// The PING returns `response.context.contextHash`.
// Where does the Zoho tab set its `response.context`?
// Let's check `extension/host/content.js` or `bridge.js`.
console.log("Checking bridge.js for PING response");
