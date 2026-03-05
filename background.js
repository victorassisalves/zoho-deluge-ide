
// Step 1: Explicit Manual Linking - Closed Tab Listener
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    try {
        const syncBus = new BroadcastChannel('deluge_ide_sync');
        syncBus.postMessage({
            type: 'ZOHO_TAB_DISCONNECTED',
            payload: { chromeTabId: tabId }
        });
        syncBus.close();
    } catch(e) {}
    console.log('[ZohoIDE] [BACKGROUND] Tab closed, broadcasted ZOHO_TAB_DISCONNECTED:', tabId);
});

// Step 1: Explicit Manual Linking - Link Request Logic
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'LINK_TAB_REQUEST') {
        console.log('[ZohoIDE] [BACKGROUND] Received LINK_TAB_REQUEST');

        const findLinkTarget = (queryObj) => {
            return new Promise(resolve => {
                chrome.tabs.query(queryObj, (tabs) => {
                    const zohoTab = tabs.find(t => isZohoUrl(t.url));
                    resolve(zohoTab);
                });
            });
        };

        (async () => {
            // 1. Fallback Strategy: Last Focused Window -> Current Window
            let targetTab = await findLinkTarget({ active: true, lastFocusedWindow: true });
            if (!targetTab) {
                targetTab = await findLinkTarget({ active: true, currentWindow: true });
            }

            if (!targetTab) {
                console.warn('[ZohoIDE] [BACKGROUND] LINK_TAB_FAILED: No active Zoho tab found.');
                sendResponse({ status: 'ERROR', code: 'NO_ZOHO_TAB' });
                return;
            }

            // 2. Scrape details from the tab
            chrome.tabs.sendMessage(targetTab.id, { action: 'PING' }, (response) => {
                if (chrome.runtime.lastError || !response || !response.context) {
                    // Try injecting scraper if it fails
                    chrome.scripting.executeScript({
                        target: { tabId: targetTab.id },
                        files: ['extension/host/content.js']
                    }).then(() => {
                         setTimeout(() => {
                             chrome.tabs.sendMessage(targetTab.id, { action: 'PING' }, (retryRes) => {
                                 if (retryRes && retryRes.context) {
                                     sendResponse({ status: 'SUCCESS', chromeTabId: targetTab.id, context: retryRes.context });
                                 } else {
                                     sendResponse({ status: 'ERROR', code: 'SCRAPER_FAILED' });
                                 }
                             });
                         }, 500);
                    }).catch(() => sendResponse({ status: 'ERROR', code: 'INJECTION_FAILED' }));
                } else {
                    sendResponse({ status: 'SUCCESS', chromeTabId: targetTab.id, context: response.context });
                }
            });
        })();
        return true;
    }
});



// Step 1: Explicit Manual Linking - Closed Tab Listener
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    try {
        const syncBus = new BroadcastChannel('deluge_ide_sync');
        syncBus.postMessage({
            type: 'ZOHO_TAB_DISCONNECTED',
            payload: { chromeTabId: tabId }
        });
        syncBus.close();
    } catch(e) {}
    console.log('[ZohoIDE] [BACKGROUND] Tab closed, broadcasted ZOHO_TAB_DISCONNECTED:', tabId);
});


// Step 1: Explicit Manual Linking - Link Request Logic
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'LINK_TAB_REQUEST') {
        console.log('[ZohoIDE] [BACKGROUND] Received LINK_TAB_REQUEST');

        const findLinkTarget = (queryObj) => {
            return new Promise(resolve => {
                chrome.tabs.query(queryObj, (tabs) => {
                    const zohoTab = tabs.find(t => isZohoUrl(t.url));
                    resolve(zohoTab);
                });
            });
        };

        (async () => {
            // 1. Fallback Strategy: Last Focused Window -> Current Window
            let targetTab = await findLinkTarget({ active: true, lastFocusedWindow: true });
            if (!targetTab) {
                targetTab = await findLinkTarget({ active: true, currentWindow: true });
            }

            if (!targetTab) {
                console.warn('[ZohoIDE] [BACKGROUND] LINK_TAB_FAILED: No active Zoho tab found.');
                sendResponse({ status: 'ERROR', code: 'NO_ZOHO_TAB' });
                return;
            }

            // 2. Scrape details from the tab
            chrome.tabs.sendMessage(targetTab.id, { action: 'PING' }, (response) => {
                if (chrome.runtime.lastError || !response || !response.context) {
                    // Try injecting scraper if it fails
                    chrome.scripting.executeScript({
                        target: { tabId: targetTab.id },
                        files: ['extension/host/content.js']
                    }).then(() => {
                         setTimeout(() => {
                             chrome.tabs.sendMessage(targetTab.id, { action: 'PING' }, (retryRes) => {
                                 if (retryRes && retryRes.context) {
                                     sendResponse({ status: 'SUCCESS', chromeTabId: targetTab.id, context: retryRes.context });
                                 } else {
                                     sendResponse({ status: 'ERROR', code: 'SCRAPER_FAILED' });
                                 }
                             });
                         }, 500);
                    }).catch(() => sendResponse({ status: 'ERROR', code: 'INJECTION_FAILED' }));
                } else {
                    sendResponse({ status: 'SUCCESS', chromeTabId: targetTab.id, context: response.context });
                }
            });
        })();
        return true;
    }
});

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
                    chrome.scripting.executeScript({
                        target: { tabId: tabId },
                        files: ['extension/host/content.js']
                    }).then(() => {
                        setTimeout(() => {
                            chrome.tabs.sendMessage(tabId, { action: 'PING' }, (retryRes) => {
                                if (retryRes && retryRes.status === 'PONG') {
                                    sendResponse({
                                        connected: true,
                                        chromeTabId: tabId,
                                        context: retryRes.context
                                    });
                                } else {
                                    sendResponse({ connected: false });
                                }
                            });
                        }, 500);
                    }).catch(() => sendResponse({ connected: false }));
                } else {
                    sendResponse({
                        connected: true,
                        chromeTabId: tabId,
                        context: response.context
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
            }, (request.payload && request.payload.targetContextHash) || request.targetContextHash);
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



    // Step 4: Explicit Manual Linking - Functionality Bridge
    if (request.type === 'EXECUTE_DOM_ACTION' || request.action === 'EXECUTE_DOM_ACTION') {
        const payloadData = request.payload || request; // Support both forms
        const { chromeTabId, fileId, action, code: srcCode } = payloadData;

        const broadcastTelemetry = (level, msg, args) => {
            try {
                const channel = new BroadcastChannel('zoho_ide_telemetry');
                channel.postMessage({
                    instanceId: request.instanceId,
                    origin: '[BACKGROUND]',
                    level,
                    message: msg,
                    args,
                    timestamp: Date.now()
                });
                channel.close();
            } catch (e) { }
        };

        if (!chromeTabId) {
            broadcastTelemetry('ERROR', 'No chromeTabId provided. Push aborted.', [fileId]);
            sendResponse({ status: 'ERROR', code: 'MISSING_TAB_ID' });
            return true;
        }

        // 1. Memorize the IDE's location (The "Boomerang" origin)
        const ideTabId = sender.tab ? sender.tab.id : null;
        const ideWindowId = sender.tab ? sender.tab.windowId : null;

        // 2. Focus the Zoho Tab (The "Focus")
        chrome.tabs.update(chromeTabId, { active: true }, () => {
            // Check for Race Condition (Tab closed before disconnect event processed)
            if (chrome.runtime.lastError) {
                broadcastTelemetry('WARN', 'Failed to focus tab, broadcasting failure.', [chromeTabId, chrome.runtime.lastError.message]);

                try {
                    const syncBus = new BroadcastChannel('deluge_ide_sync');
                    syncBus.postMessage({
                        type: 'EXECUTE_ACTION_FAILED',
                        payload: { fileId, reason: 'Target tab closed unexpectedly. Operation aborted.', chromeTabId }
                    });

                    syncBus.postMessage({
                        type: 'ZOHO_TAB_DISCONNECTED',
                        payload: { chromeTabId }
                    });
                    syncBus.close();
                } catch(e) { console.warn(e); }

                sendResponse({ status: 'ERROR', code: 'TAB_NOT_FOUND' });
                return;
            }

            // 3. Send the command to the Content Script (The "Fire")
            const contentScriptPayload = {
                type: action,
                instanceId: request.instanceId || Date.now().toString(),
                payload: { code: srcCode }
            };

            broadcastTelemetry('INFO', `Firing ${action} to Content Script`, [chromeTabId, fileId]);

            chrome.tabs.sendMessage(chromeTabId, contentScriptPayload, (response) => {

                // 4. Boomerang back to the IDE
                if (ideTabId) {
                    chrome.tabs.update(ideTabId, { active: true });
                }
                if (ideWindowId) {
                    chrome.windows.update(ideWindowId, { focused: true });
                }

                if (chrome.runtime.lastError) {
                    broadcastTelemetry('ERROR', 'Content script execution failed:', [chrome.runtime.lastError.message]);
                    try {
                        const syncBus = new BroadcastChannel('deluge_ide_sync');
                        syncBus.postMessage({
                            type: 'EXECUTE_ACTION_FAILED',
                            payload: { fileId, reason: chrome.runtime.lastError.message, chromeTabId }
                        });
                        syncBus.close();
                    } catch(e) {}
                    sendResponse({ status: 'ERROR', code: 'CONTENT_SCRIPT_FAILED', message: chrome.runtime.lastError.message });
                } else {
                    // If it's PULL, forward via standard protocol for legacy support
                    if (action === 'editor:pull' || action === 'GET_ZOHO_CODE') {
                        chrome.runtime.sendMessage({
                            action: 'editor:pull:response',
                            payload: response
                        });
                    }
                    sendResponse(response || { status: 'SUCCESS' });
                }
            });
        });

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

        // Default behavior if no target context specified
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
