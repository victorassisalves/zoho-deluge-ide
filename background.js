// Background script for Zoho Deluge IDE

let lastZohoTabId = null;

function openIDETab() {
    const ideUrl = chrome.runtime.getURL('ide.html');
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

function openIDESidePanel() {
    chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
        const activeTab = activeTabs[0];
        if (activeTab && isZohoUrl(activeTab.url)) {
            chrome.tabs.sendMessage(activeTab.id, { action: 'INJECT_SIDE_PANEL' }, (response) => {
                if (chrome.runtime.lastError) {
                    chrome.scripting.executeScript({
                        target: { tabId: activeTab.id },
                        files: ['content.js']
                    }).then(() => {
                        setTimeout(() => {
                            chrome.tabs.sendMessage(activeTab.id, { action: 'INJECT_SIDE_PANEL' });
                        }, 500);
                    });
                }
            });
        } else {
            openIDETab();
        }
    });
}

function broadcastToIDE(message) {
    chrome.runtime.sendMessage(message);
}

chrome.commands.onCommand.addListener((command) => {
    if (command === "sync-save") broadcastToIDE({ action: "CMD_SYNC_SAVE" });
    else if (command === "sync-save-execute") broadcastToIDE({ action: "CMD_SYNC_SAVE_EXECUTE" });
    else if (command === "pull-code") broadcastToIDE({ action: "CMD_PULL_CODE" });
    else if (command === "activate-ide") {
        chrome.storage.local.get(['activation_behavior'], (result) => {
            const behavior = result.activation_behavior || 'new-tab';
            if (behavior === 'new-tab') openIDETab();
            else if (behavior === 'side-panel') openIDESidePanel();
            else if (behavior === 'smart') {
                chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
                    const activeTab = activeTabs[0];
                    if (activeTab && isZohoUrl(activeTab.url)) openIDESidePanel();
                    else openIDETab();
                });
            }
        });
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    let isSidePanel = sender.tab && isZohoUrl(sender.tab.url);
    let targetTabId = isSidePanel ? sender.tab.id : null;

    if (request.action === 'CHECK_CONNECTION') {
        const getTabMetadata = (tab) => {
            return new Promise((resolve) => {
                chrome.tabs.sendMessage(tab.id, { action: 'GET_METADATA' }, (response) => {
                    if (chrome.runtime.lastError || !response) {
                        resolve({ id: tab.id, connected: true, tabTitle: tab.title, url: tab.url });
                    } else {
                        resolve({ id: tab.id, connected: true, ...response });
                    }
                });
            });
        };

        chrome.tabs.query({}, async (tabs) => {
            const zohoTabs = tabs.filter(t => isZohoUrl(t.url));
            const metadataPromises = zohoTabs.map(t => getTabMetadata(t));
            const allMetadata = await Promise.all(metadataPromises);

            // Determine active tab info for backward compatibility
            let activeTabInfo = null;
            if (targetTabId) {
                activeTabInfo = allMetadata.find(m => m.id === targetTabId);
            } else {
                const activeTab = zohoTabs.find(t => t.active);
                if (activeTab) activeTabInfo = allMetadata.find(m => m.id === activeTab.id);
                else if (allMetadata.length > 0) activeTabInfo = allMetadata[0];
            }

            sendResponse({
                connected: !!activeTabInfo,
                ...activeTabInfo,
                allOnlineTabs: allMetadata
            });
        });
        return true;
    }

    if (request.action === 'OPEN_ZOHO_EDITOR') {
        const handleOpen = (tabId) => {
            chrome.tabs.update(tabId, { active: true });
            chrome.windows.update(sender.tab ? sender.tab.windowId : tabId, { focused: true });
        };
        if (targetTabId) handleOpen(targetTabId);
        else findZohoTab(tab => tab && handleOpen(tab.id));
        sendResponse({ success: true });
        return true;
    }

    if (request.action === 'GET_ZOHO_CODE' || request.action === 'SET_ZOHO_CODE' || request.action === 'SAVE_ZOHO_CODE' || request.action === 'EXECUTE_ZOHO_CODE') {
        const handleAction = async (tabId) => {
            // Level 3 Blacklist Check
            const isBlacklisted = await checkBlacklist(tabId);
            if (isBlacklisted) {
                sendResponse({ error: 'Tab is blacklisted (No Follow mode active)' });
                return;
            }

            lastZohoTabId = tabId;
            try {
                const results = await chrome.scripting.executeScript({
                    target: { tabId: tabId, allFrames: true },
                    world: 'MAIN',
                    func: () => {
                        // Check for common editor objects and elements in the main world
                        const hasMonaco = !!(window.monaco && (window.monaco.editor || window.monaco.languages));
                        const hasAce = !!(window.ace && window.ace.edit) || !!document.querySelector('.ace_editor, .zace-editor, lyte-ace-editor');
                        const hasCodeMirror = !!document.querySelector('.CodeMirror');
                        const hasDelugeEditor = !!document.querySelector('[id*="delugeEditor"], .deluge-editor, [id*="script"], textarea.deluge-editor');
                        const hasZEditor = !!(window.ZEditor || window.Zace || window.delugeEditor);

                        return hasMonaco || hasAce || hasCodeMirror || hasDelugeEditor || hasZEditor;
                    }
                });

                if (!results || results.length === 0) {
                    sendResponse({ error: 'No frames found in tab' });
                    return;
                }

                // Prefer frames where result is true
                const sortedFrames = results.sort((a, b) => {
                    if (a.result === b.result) return 0;
                    return a.result ? -1 : 1;
                });

                let lastErr = null;
                for (const frame of sortedFrames) {
                    try {
                        const response = await new Promise((resolve, reject) => {
                            chrome.tabs.sendMessage(tabId, request, { frameId: frame.frameId }, (res) => {
                                if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
                                else resolve(res);
                            });
                        });
                        if (response && (request.action === 'GET_ZOHO_CODE' ? !!response.code : !!response.success)) {
                            sendResponse(response);
                            return;
                        }
                        if (response && response.error) lastErr = response.error;
                    } catch (e) {
                        console.warn(`[ZohoIDE] Frame ${frame.frameId} fail:`, e);
                    }
                }
                sendResponse({ error: lastErr || 'No editor found in any frame' });
            } catch (err) {
                sendResponse({ error: 'Frame traversal failed: ' + err.message });
            }
        };

        if (targetTabId) handleAction(targetTabId);
        else findZohoTab(tab => tab ? handleAction(tab.id) : sendResponse({ error: 'No Zoho tab found' }));
        return true;
    }

    if (request.action === 'ZOHO_CONSOLE_UPDATE') {
        chrome.runtime.sendMessage({
            action: 'IDE_CONSOLE_UPDATE',
            data: request.data,
            sourceTabId: sender.tab ? sender.tab.id : null
        });
    }

    if (request.action === 'ZOHO_TAB_FOCUS') {
        if (sender.tab) {
            broadcastToIDE({ action: 'CONTEXT_SWITCH', tabId: sender.tab.id, url: sender.tab.url });
        }
    }
});

function findZohoTab(callback) {
    chrome.tabs.query({}, (allTabs) => {
        const zohoTabs = allTabs.filter(t => t.url && isZohoUrl(t.url));
        if (zohoTabs.length === 0) return callback(null);
        const activeZoho = zohoTabs.find(t => t.active);
        if (activeZoho) return callback(activeZoho);
        const editorTab = zohoTabs.find(t => t.url.includes('creator') || t.url.includes('crm') || t.url.includes('flow') || t.title.toLowerCase().includes('deluge'));
        callback(editorTab || zohoTabs[0]);
    });
}

function isZohoUrl(url) {
    if (!url) return false;
    const domains = ["zoho.com", "zoho.eu", "zoho.in", "zoho.com.au", "zoho.jp", "zoho.ca", "zoho.uk", "zoho.com.cn"];
    return domains.some(d => url.includes(d));
}

// 500ms Debounced Scraper
let scraperTimeout = null;

async function debouncedScrape(tabId, url) {
    if (scraperTimeout) clearTimeout(scraperTimeout);
    scraperTimeout = setTimeout(async () => {
        console.log('[ZohoIDE] Running debounced scraper for tab:', tabId);

        // Level 3: Blacklist Check
        const isBlacklisted = await checkBlacklist(tabId);
        if (isBlacklisted) {
            console.log('[ZohoIDE] Tab is blacklisted (No Follow). Stopping.');
            return;
        }

        broadcastToIDE({ action: 'CONTEXT_SWITCH', tabId: tabId, url: url });
    }, 500);
}

// Access IndexedDB from Background
async function checkBlacklist(tabId) {
    // Check URL first (Level 2/3) to avoid messaging tab if possible
    const tab = await new Promise(r => chrome.tabs.get(tabId, r));
    if (tab && tab.url) {
        if (await isIdBlacklisted(tab.url)) return true;
    }

    // We might not have the stable ID yet, so we ask the tab for its metadata
    return new Promise((resolve) => {
        chrome.tabs.sendMessage(tabId, { action: 'GET_METADATA' }, async (response) => {
            if (chrome.runtime.lastError || !response) {
                // Fallback to URL check if metadata fails
                chrome.tabs.get(tabId, async (tab) => {
                    if (!tab) return resolve(false);
                    const isUrlBlacklisted = await isIdBlacklisted(tab.url);
                    resolve(isUrlBlacklisted);
                });
                return;
            }

            let stableId = "global";
            if (response.orgId && response.system && response.functionId && response.orgId !== 'unknown' && response.functionId !== 'unknown') {
                stableId = `${response.orgId}:${response.system}:${response.functionId}`;
            } else {
                stableId = response.url || "global";
            }

            const blacklisted = await isIdBlacklisted(stableId);
            resolve(blacklisted);
        });
    });
}

// Since Dexie might not be easily available in Service Worker without bundling,
// we'll use raw IndexedDB or message the IDE to check.
// Better yet, let's use chrome.storage.local for the blacklist to keep it simple and fast across contexts.
// The user asked for IndexedDB via Dexie for persistence, but for Level 3 filtering, speed is key.
// I'll keep the blacklist in chrome.storage.local as well for fast access in background/content scripts.

async function isIdBlacklisted(id) {
    return new Promise((resolve) => {
        chrome.storage.local.get(['zide_blacklist'], (result) => {
            const blacklist = result.zide_blacklist || [];
            resolve(blacklist.includes(id));
        });
    });
}

// Multi-Tab Hygiene: Event-driven context switching
chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (tab && isZohoUrl(tab.url)) {
            debouncedScrape(activeInfo.tabId, tab.url);
        }
    });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && isZohoUrl(tab.url)) {
        debouncedScrape(tabId, tab.url);
    }
});
