// Background script for Zoho Deluge IDE

let lastZohoTabId = null;

function isZohoUrl(url) {
    if (!url) return false;
    const domains = ["zoho.com", "zoho.eu", "zoho.in", "zoho.com.au", "zoho.jp", "zoho.ca", "zoho.uk", "zoho.com.cn"];
    return domains.some(d => url.includes(d));
}

function broadcastToIDE(message) {
    chrome.runtime.sendMessage(message);
}

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

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && isZohoUrl(tab.url)) {
        broadcastToIDE({ action: 'SYNC_TABS' });
    }
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    broadcastToIDE({ action: 'SYNC_TABS' });
});

chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (tab && tab.url && isZohoUrl(tab.url)) {
            broadcastToIDE({ action: 'SYNC_TABS' });
        }
    });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    let isSidePanel = sender.tab && isZohoUrl(sender.tab.url);
    let targetTabId = isSidePanel ? sender.tab.id : null;

    if (request.action === 'CHECK_CONNECTION') {
        if (targetTabId) {
            chrome.tabs.get(targetTabId, (tab) => sendResponse({ connected: true, tabTitle: tab.title, url: tab.url }));
        } else {
            findZohoTab((tab) => {
                if (tab) sendResponse({ connected: true, tabTitle: tab.title, url: tab.url, isStandalone: true });
                else sendResponse({ connected: false });
            });
        }
        return true;
    }

    if (request.action === 'GET_ALL_ZOHO_TABS') {
        getAllZohoTabs(sendResponse);
        return true;
    }

    if (request.action === 'OPEN_ZOHO_EDITOR') {
        const handleOpen = (tabId) => {
            chrome.tabs.get(tabId, (tab) => {
                if (chrome.runtime.lastError || !tab) return;
                chrome.tabs.update(tabId, { active: true });
                chrome.windows.update(tab.windowId, { focused: true });
            });
        };
        if (request.tabId) handleOpen(request.tabId);
        else if (targetTabId) handleOpen(targetTabId);
        else findZohoTab(tab => tab && handleOpen(tab.id));
        sendResponse({ success: true });
        return true;
    }

    if (request.action === 'GET_ZOHO_CODE' || request.action === 'SET_ZOHO_CODE' || request.action === 'SAVE_ZOHO_CODE' || request.action === 'EXECUTE_ZOHO_CODE') {
        const handleAction = async (tabId) => {
            console.log('[ZohoIDE] handleAction:', request.action, 'for tab:', tabId);
            if (!tabId) {
                sendResponse({ error: 'No target tab specified' });
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

                console.log('[ZohoIDE] Frames found in tab', tabId, ':', sortedFrames.length);

                let lastErr = null;
                for (const frame of sortedFrames) {
                    try {
                        console.log('[ZohoIDE] Relaying to tab', tabId, 'frame', frame.frameId);
                        const response = await new Promise((resolve, reject) => {
                            chrome.tabs.sendMessage(tabId, request, { frameId: frame.frameId }, (res) => {
                                if (chrome.runtime.lastError) {
                                    console.warn('[ZohoIDE] sendMessage runtime error:', chrome.runtime.lastError);
                                    reject(chrome.runtime.lastError);
                                }
                                else resolve(res);
                            });
                        });
                        console.log('[ZohoIDE] Response from frame', frame.frameId, ':', response);
                        if (response && (request.action === 'GET_ZOHO_CODE' ? !!response.code : !!response.success)) {
                            sendResponse(response);
                            return;
                        }
                        if (response && response.error) lastErr = response.error;
                    } catch (e) {
                        console.warn(`[ZohoIDE] Frame ${frame.frameId} fail:`, e);
                    }
                }
                console.log('[ZohoIDE] No valid response from any frame in tab', tabId);
                sendResponse({ error: lastErr || 'No editor found in any frame' });
            } catch (err) {
                sendResponse({ error: 'Frame traversal failed: ' + err.message });
            }
        };

        // Priority: Explicit tabId > sender tab (sidepanel) > find active tab
        const activeTabId = request.tabId || targetTabId;
        if (activeTabId) handleAction(activeTabId);
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

async function getAllZohoTabs(callback) {
    chrome.tabs.query({}, async (allTabs) => {
        // Sort tabs by ID to ensure consistent sequence numbering
        const zohoTabs = allTabs.filter(t => t.url && isZohoUrl(t.url)).sort((a, b) => a.id - b.id);

        const metadataPromises = zohoTabs.map(tab => getTabMetadata(tab.id).catch(() => null));
        const allMetadata = await Promise.all(metadataPromises);

        const results = zohoTabs.map((tab, index) => {
            const metadata = allMetadata[index];
            return {
                tabId: tab.id,
                windowId: tab.windowId,
                active: tab.active,
                title: tab.title,
                url: tab.url,
                tabSequence: index + 1,
                ...(metadata || {
                    system: 'Zoho',
                    orgId: 'global',
                    functionId: 'unknown',
                    functionName: tab.title,
                    folder: 'General'
                })
            };
        });

        callback(results);
    });
}

async function getTabMetadata(tabId) {
    const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms));

    try {
        const results = await Promise.race([
            chrome.scripting.executeScript({
                target: { tabId: tabId, allFrames: true },
                world: 'MAIN',
                func: () => {
                    const hasEditor = !!(window.monaco?.editor || window.ace?.edit || document.querySelector('.ace_editor, .zace-editor, lyte-ace-editor, .CodeMirror, [id*="delugeEditor"]'));
                    return hasEditor;
                }
            }),
            timeout(1500)
        ]);

        const editorFrames = results.filter(r => r.result);
        if (editorFrames.length === 0) return null;

        // Try to get metadata from the first frame that has an editor
        for (const frame of editorFrames) {
            try {
                const meta = await Promise.race([
                    new Promise((resolve, reject) => {
                        chrome.tabs.sendMessage(tabId, { action: 'GET_ZOHO_METADATA' }, { frameId: frame.frameId }, (res) => {
                            if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
                            else resolve(res);
                        });
                    }),
                    timeout(1500)
                ]);
                if (meta && meta.system) return meta;
            } catch (e) {
                console.warn(`[ZohoIDE] Meta fetch failed for tab ${tabId} frame ${frame.frameId}:`, e.message);
            }
        }
    } catch (e) {
        console.warn(`[ZohoIDE] Metadata extraction timed out for tab ${tabId}:`, e.message);
    }
    return null;
}

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

