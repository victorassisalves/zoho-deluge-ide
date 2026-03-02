// Background script for Zoho Deluge IDE

// The Registry: Map of tabId -> Tab Info
const activeZohoTabs = new Map();

// Helper to broadcast to all open IDE instances
function broadcastToIDE(type, payload = {}) {
    chrome.runtime.sendMessage({ action: type, payload });
}

// Track when tabs are updated (e.g., navigated to a new Zoho page)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && isZohoUrl(tab.url)) {
        // Ping the tab to see if it's a valid Zoho editor environment
        chrome.tabs.sendMessage(tabId, { action: 'PING' }, (response) => {
            if (!chrome.runtime.lastError && response && response.status === 'PONG') {
                const tabInfo = {
                    tabId,
                    title: tab.title,
                    url: tab.url,
                    context: response.context
                };
                activeZohoTabs.set(tabId, tabInfo);
                broadcastToIDE('ZOHO_TAB_DETECTED', tabInfo);
            }
        });
    } else if (changeInfo.status === 'complete' && activeZohoTabs.has(tabId) && !isZohoUrl(tab.url)) {
        // Tab navigated away from Zoho
        activeZohoTabs.delete(tabId);
        broadcastToIDE('ZOHO_TAB_DISCONNECTED', { tabId });
    }
});

// Track when tabs are closed
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    if (activeZohoTabs.has(tabId)) {
        activeZohoTabs.delete(tabId);
        broadcastToIDE('ZOHO_TAB_DISCONNECTED', { tabId });
    }
});

// --- Command Handling ---
function openIDETab() {
    const ideUrl = chrome.runtime.getURL('app/index.html');
    chrome.tabs.query({}, (tabs) => {
        const existingTab = tabs.find(t => t.url && t.url.startsWith(ideUrl));
        if (existingTab) {
            chrome.tabs.update(existingTab.id, { active: true });
            chrome.windows.update(existingTab.windowId, { focused: true });
        } else {
            chrome.tabs.create({ url: ideUrl });
        }
    });
}

// ... keeping side panel logic if needed, but standardizing opening ...
chrome.commands.onCommand.addListener((command) => {
    if (command === "activate-ide") {
        openIDETab();
    }
});

// --- Protocol Handling ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const action = request.action || request.type;

    // IDE requesting the list of all currently active Zoho tabs
    if (action === 'FETCH_ACTIVE_ZOHO_TABS') {
        // Perform a fresh sweep just in case we missed events
        chrome.tabs.query({}, (tabs) => {
            const zohoTabs = tabs.filter(t => isZohoUrl(t.url));
            let checked = 0;
            const validTabs = [];

            if (zohoTabs.length === 0) {
                sendResponse({ tabs: [] });
                return;
            }

            zohoTabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, { action: 'PING' }, (response) => {
                    checked++;
                    if (!chrome.runtime.lastError && response && response.status === 'PONG') {
                        const tabInfo = {
                            tabId: tab.id,
                            title: tab.title,
                            url: tab.url,
                            context: response.context
                        };
                        activeZohoTabs.set(tab.id, tabInfo);
                        validTabs.push(tabInfo);
                    } else {
                        activeZohoTabs.delete(tab.id);
                    }

                    if (checked === zohoTabs.length) {
                        sendResponse({ tabs: validTabs });
                    }
                });
            });
        });
        return true; // async response
    }

    // IDE wants to route a command to a specific tab
    const relayActions = [
        'editor:init', 'editor:execute', 'editor:save', 'editor:pull', 'GET_ZOHO_CODE'
    ];

    if (relayActions.includes(action)) {
        const targetTabId = request.targetTabId || request.tabId; // Extract target from payload

        if (!targetTabId) {
            sendResponse({ error: 'No target tabId specified for routing' });
            return false;
        }

        // Send the specific action directly to the content script of the target tab
        chrome.tabs.sendMessage(targetTabId, request, (response) => {
            if (chrome.runtime.lastError) {
                console.warn(`[ZohoIDE Background] Failed to route ${action} to tab ${targetTabId}`, chrome.runtime.lastError);
                sendResponse({ error: chrome.runtime.lastError.message });
            } else {
                sendResponse(response);
            }
        });
        return true; // async response
    }

    // Handle incoming logs from Host Page
    if (action === 'ZOHO_CONSOLE_UPDATE') {
        broadcastToIDE('IDE_CONSOLE_UPDATE', {
            data: request.data,
            sourceTabId: sender.tab ? sender.tab.id : null
        });
        return false;
    }
});

function isZohoUrl(url) {
    if (!url) return false;
    const domains = ["zoho.com", "zoho.eu", "zoho.in", "zoho.com.au", "zoho.jp", "zoho.ca", "zoho.uk", "zoho.com.cn"];
    return domains.some(d => url.includes(d));
}
