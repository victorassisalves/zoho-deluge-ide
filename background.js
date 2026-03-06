// Background script for Zoho Deluge IDE

let lastZohoTabId = null;

function openIDETab() {
    const ideUrl = chrome.runtime.getURL('app/index.html');
    chrome.tabs.query({}, (tabs) => {
        const existingTab = tabs.find(t => t.url && t.url.startsWith(ideUrl));
        if (existingTab) {
            chrome.tabs.update(existingTab.id, { active: true });
            chrome.windows.update(existingTab.windowId, { focused: true });

            // If the user activated the IDE from a Zoho tab, tell the IDE to link to it
            chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
                const activeTab = activeTabs[0];
                if (activeTab && isZohoUrl(activeTab.url)) {
                    chrome.tabs.sendMessage(activeTab.id, { action: 'PING' }, (response) => {
                        if (response && response.status === 'PONG' && response.context) {
                            chrome.tabs.sendMessage(existingTab.id, { action: 'FORCE_LINK_TAB', context: response.context });
                        }
                    });
                }
            });
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


    let isSidePanel = sender.tab && isZohoUrl(sender.tab.url);
    // If the IDE explicitly passes targetTabId (from chromeTabId in db), use it!
    let targetTabId = isSidePanel ? sender.tab.id : (request.targetTabId || (request.payload && request.payload.targetTabId) || null);


    if (request.action === 'LINK_FILE_TO_TAB') {
        const fileId = request.fileId;
        const requestedTabId = request.tabId; // ID of the specific tab chosen by the user


        const linkToTab = (targetTabId) => {
            linkedTabs.set(targetTabId, fileId); // Cache the connection globally
            chrome.tabs.sendMessage(targetTabId, { action: 'SET_CONTEXT_HASH', contextHash: fileId }, (res) => {

                if (chrome.runtime.lastError) {
                    sendResponse({ success: false, error: 'Could not connect to tab. Try refreshing it.' });
                    return;
                }
                chrome.tabs.sendMessage(targetTabId, { action: 'PING' }, (pingRes) => {
                    if (pingRes && pingRes.status === 'PONG') {
                        sendResponse({ success: true, context: pingRes.context });
                    } else {
                        sendResponse({ success: false, error: 'Ping failed after link' });
                    }
                });
            });
        };

        if (requestedTabId) {
            linkToTab(requestedTabId);
        } else {
            // Fallback: active zoho tab in current window
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const activeTab = tabs[0];
                if (activeTab && isZohoUrl(activeTab.url)) {
                    linkToTab(activeTab.id);
                } else {
                    sendResponse({ success: false, error: 'No specific tab ID provided and current tab is not Zoho.' });
                }
            });
        }
        return true;
    }

    if (request.action === 'GET_ALL_ZOHO_TABS') {
        chrome.tabs.query({}, (allTabs) => {
            const zohoTabs = allTabs.filter(t => t.url && isZohoUrl(t.url)).map(t => ({
                id: t.id,
                title: t.title,
                url: t.url,
                windowId: t.windowId
            }));
            sendResponse({ tabs: zohoTabs });
        });
        return true;
    }

    if (request.action === 'GET_ACTIVE_ZOHO_TAB') {
        // Find the currently active tab or the most recently active Zoho tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            if (activeTab && isZohoUrl(activeTab.url)) {
                chrome.tabs.sendMessage(activeTab.id, { action: 'PING' }, (response) => {
                    if (response && response.status === 'PONG' && response.context) {
                        sendResponse({ success: true, context: response.context });
                    } else {
                        sendResponse({ success: false });
                    }
                });
            } else {
                // If the IDE itself is the active tab, query for all zoho tabs
                chrome.tabs.query({}, (allTabs) => {
                    const zohoTabs = allTabs.filter(t => t.url && isZohoUrl(t.url));
                    if (zohoTabs.length > 0) {
                        // Just pick the first one for now, or the most recently accessed if we had that data
                        chrome.tabs.sendMessage(zohoTabs[0].id, { action: 'PING' }, (response) => {
                            if (response && response.status === 'PONG' && response.context) {
                                sendResponse({ success: true, context: response.context });
                            } else {
                                sendResponse({ success: false });
                            }
                        });
                    } else {
                        sendResponse({ success: false });
                    }
                });
            }
        });
        return true;
    }

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
            // Find ALL active zoho tabs across ALL windows to ensure they are discovered
            chrome.tabs.query({}, (allTabs) => {
                const zohoTabs = allTabs.filter(t => t.url && isZohoUrl(t.url));

                // If a specific context hash is requested, find it
                const targetHash = (request.payload && request.payload.targetContextHash) || request.targetContextHash;

                findZohoTab((tab) => {
                    if (tab) verifyConnection(tab.id);
                    else sendResponse({ connected: false });
                }, targetHash);

                // Silently ping other tabs to trigger background discovery
                if (zohoTabs.length > 1) {
                    zohoTabs.forEach(t => {
                        chrome.tabs.sendMessage(t.id, { action: 'PING' });
                    });
                }
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
        else if (request.targetTabId) handleOpen(request.targetTabId);
        else findZohoTab(tab => tab && handleOpen(tab.id), (request.payload && request.payload.targetContextHash) || request.targetContextHash);
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
        else findZohoTab((tab) => {
            if (tab) {
                handleAction(tab.id);
                // Trigger auto focus after successfully handling action if requested
                if ((request.payload && request.payload.autoFocus) || request.autoFocus) {
                    chrome.tabs.update(tab.id, { active: true });
                    chrome.windows.update(tab.windowId, { focused: true });
                }
            } else {
                sendResponse({ error: 'No matching Zoho tab found for context' });
            }
        }, (request.payload && request.payload.targetContextHash) || request.targetContextHash);
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

function findZohoTab(callback, targetContextHash = null) {
    chrome.tabs.query({}, (allTabs) => {
        const zohoTabs = allTabs.filter(t => t.url && isZohoUrl(t.url));
        if (zohoTabs.length === 0) return callback(null);

        // If a specific context is requested, we need to check tabs to find it

        if (targetContextHash) {
            // First check our cache for a direct map
            for (const [tId, hash] of linkedTabs.entries()) {
                if (hash === targetContextHash) {
                    const cachedTab = zohoTabs.find(t => t.id === tId);
                    if (cachedTab) {
                        return callback(cachedTab);
                    }
                }
            }

            // Ping tabs to find matching context (fallback)

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

        // Default behavior if no target context specified
        // First try to find any active zoho tab across ANY window
        const activeZoho = zohoTabs.find(t => t.active);
        if (activeZoho) return callback(activeZoho);

        // Then try to find one that looks like an editor
        const editorTab = zohoTabs.find(t => t.url.includes('creator') || t.url.includes('crm') || t.url.includes('flow') || t.title.toLowerCase().includes('deluge'));
        callback(editorTab || zohoTabs[0]);
    });
}


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

function isZohoUrl(url) {
    if (!url) return false;
    const domains = ["zoho.com", "zoho.eu", "zoho.in", "zoho.com.au", "zoho.jp", "zoho.ca", "zoho.uk", "zoho.com.cn"];
    return domains.some(d => url.includes(d));
}
