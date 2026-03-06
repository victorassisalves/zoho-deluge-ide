const fs = require('fs');

let code = fs.readFileSync('background.js', 'utf8');

// When `CHECK_CONNECTION` is called, it verifies `targetTabId` or uses `findZohoTab`.
// But wait! `CHECK_CONNECTION` is called on an interval.
// If the tab just reloaded, the ping fails, it INJECTS the content script, then retries PING once.
// BUT the newly injected content script / bridge will have `contextHash = null`!
// So it doesn't match `targetContextHash` anymore if checked via `findZohoTab`!
//
// By implementing the `linkedTabs` map and `chrome.tabs.onUpdated`, we automatically re-inject `SET_CONTEXT_HASH`.
// Also, during `CHECK_CONNECTION`'s injection retry, we should check `linkedTabs.has(tabId)` and re-set it!
const injectRetryLogic = `
                            chrome.tabs.sendMessage(tabId, { action: 'PING' }, (retryRes) => {
                                if (retryRes && retryRes.status === 'PONG') {
                                    // RE-ESTABLISH lost context
                                    if (!retryRes.context || !retryRes.context.contextHash) {
                                        if (linkedTabs.has(tabId)) {
                                            chrome.tabs.sendMessage(tabId, { action: 'SET_CONTEXT_HASH', contextHash: linkedTabs.get(tabId) });
                                        }
                                    }
                                    chrome.tabs.get(tabId, (tab) => {
                                        sendResponse({
                                            connected: true,
                                            tabTitle: tab.title,
                                            url: tab.url,
                                            context: retryRes.context,
                                            id: tabId,
                                            isStandalone: !isSidePanel
                                        });
                                    });
`;

code = code.replace(/chrome\.tabs\.sendMessage\(tabId, \{ action: 'PING' \}, \(retryRes\) => \{\s*if \(retryRes && retryRes\.status === 'PONG'\) \{\s*chrome\.tabs\.get\(tabId, \(tab\) => \{\s*sendResponse\(\{/, injectRetryLogic);

fs.writeFileSync('background.js', code);
console.log('Fixed CHECK_CONNECTION retry loop to re-establish context');
