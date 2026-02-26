// Background script for Zoho Deluge IDE

let lastZohoTabId = null;

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

function openIDESidePanel() {
    chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
        const activeTab = activeTabs[0];
        if (activeTab && isZohoUrl(activeTab.url)) {
            chrome.tabs.sendMessage(activeTab.id, { action: 'INJECT_SIDE_PANEL' }, (response) => {
                if (chrome.runtime.lastError) {
                    chrome.scripting.executeScript({
                        target: { tabId: activeTab.id },
                        files: ['extension/host/content.js']
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
        const verifyConnection = (tabId) => {
            chrome.tabs.sendMessage(tabId, { action: 'PING' }, (response) => {
                if (chrome.runtime.lastError || !response || response.status !== 'PONG') {
                     // Try injecting content script if ping fails (maybe reload happened)
                    chrome.scripting.executeScript({
                        target: { tabId: tabId },
                        files: ['extension/host/content.js']
                    }).then(() => {
                        // Retry Ping once
                        setTimeout(() => {
                            chrome.tabs.sendMessage(tabId, { action: 'PING' }, (retryRes) => {
                                if (retryRes && retryRes.status === 'PONG') {
                                    chrome.tabs.get(tabId, (tab) => {
                                        sendResponse({
                                            connected: true,
                                            tabTitle: tab.title,
                                            url: tab.url,
                                            context: retryRes.context,
                                            isStandalone: !isSidePanel
                                        });
                                    });
                                } else {
                                    sendResponse({ connected: false });
                                }
                            });
                        }, 500); // Increased wait time for injection
                    }).catch(() => sendResponse({ connected: false }));
                } else {
                    chrome.tabs.get(tabId, (tab) => {
                        sendResponse({
                            connected: true,
                            tabTitle: tab.title,
                            url: tab.url,
                            context: response.context,
                            isStandalone: !isSidePanel
                        });
                    });
                }
            });
        };

        if (targetTabId) {
            verifyConnection(targetTabId);
        } else {
            findZohoTab((tab) => {
                if (tab) verifyConnection(tab.id);
                else sendResponse({ connected: false });
            });
        }
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

    // Handle both legacy string actions and new Protocol actions
    const relayActions = [
        'GET_ZOHO_CODE', 'SET_ZOHO_CODE', 'SAVE_ZOHO_CODE', 'EXECUTE_ZOHO_CODE',
        'editor:init', 'editor:execute', 'editor:save', 'editor:pull'
    ];

    if (relayActions.includes(request.action)) {
        const handleAction = async (tabId) => {
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
                        // For GET/PULL actions, check for code. For others, check for success or just non-error.
                        const isPull = request.action === 'GET_ZOHO_CODE' || request.action === 'editor:pull' || request.action === 'editor:init';
                        if (response && (isPull ? !!response.code : !!response.success)) {
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
