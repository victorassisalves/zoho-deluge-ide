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

// --- Phase 3: Event-Driven Logic ---

async function registerTab(tabId, fileId) {
    if (!tabId || !fileId) return;
    await chrome.storage.session.set({ [`tab_${tabId}`]: fileId });
}

async function getFileForTab(tabId) {
    const result = await chrome.storage.session.get(`tab_${tabId}`);
    return result[`tab_${tabId}`];
}

chrome.tabs.onActivated.addListener(async (activeInfo) => {
    // 1. Instant Switchboard Notification
    const tabId = activeInfo.tabId;
    const fileId = await getFileForTab(tabId);

    // Broadcast TAB_SWITCHED immediately if we know the file
    if (fileId) {
        broadcastToIDE({ type: 'TAB_SWITCHED', tabId: tabId, fileId: fileId });
    }

    // 2. Legacy Fallback / Metadata Refresh
    chrome.tabs.get(tabId, (tab) => {
        if (tab && tab.url && isZohoUrl(tab.url)) {
            // Send legacy sync for list updates (slow)
            broadcastToIDE({ action: 'SYNC_TABS' });
        }
    });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    let isSidePanel = sender.tab && isZohoUrl(sender.tab.url);
    let targetTabId = isSidePanel ? sender.tab.id : null;

    if (request.action === 'CHECK_CONNECTION') {
        const verifyConnection = (tab) => {
             // Try to PING the tab to see if bridge is alive
             console.log('[ZohoIDE] Pinging tab', tab.id);
             chrome.tabs.sendMessage(tab.id, { action: 'PING' }, (response) => {
                 if (chrome.runtime.lastError) {
                     // Try injecting if runtime error (meaning no listener)
                     console.log('[ZohoIDE] PING failed (Runtime Error), injecting content script...', chrome.runtime.lastError.message);
                     chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        files: ['content.js']
                     }).then(() => {
                         // Wait a bit longer for injection + bridge load
                         console.log('[ZohoIDE] Injection successful, waiting for bridge...');
                         let attempts = 0;
                         const maxAttempts = 5;

                         const pollPing = () => {
                             attempts++;
                             console.log(`[ZohoIDE] PING Retry ${attempts}...`);
                             chrome.tabs.sendMessage(tab.id, { action: 'PING' }, (res2) => {
                                 if (res2 && res2.status === 'PONG') {
                                      console.log('[ZohoIDE] PONG received on retry!');
                                      sendResponse({ connected: true, tabTitle: tab.title, url: tab.url, product: res2.product });
                                 } else {
                                      if (attempts < maxAttempts) {
                                          setTimeout(pollPing, 500);
                                      } else {
                                          console.log('[ZohoIDE] PING failed after retries.');
                                          sendResponse({ connected: false, error: 'Bridge not responding after injection' });
                                      }
                                 }
                             });
                         };

                         setTimeout(pollPing, 1000); // Initial wait 1s

                     }).catch((e) => {
                         console.error('[ZohoIDE] Injection failed:', e);
                         sendResponse({ connected: false, error: 'Injection failed: ' + e.message });
                     });
                     return;
                 }

                 if (response && response.status === 'PONG') {
                     console.log('[ZohoIDE] PONG received immediately!');
                     sendResponse({ connected: true, tabTitle: tab.title, url: tab.url, product: response.product });
                 } else {
                     console.log('[ZohoIDE] PING response invalid:', response);
                     sendResponse({ connected: false, error: 'No PONG response' });
                 }
             });
        };

        if (targetTabId) {
            chrome.tabs.get(targetTabId, (tab) => verifyConnection(tab));
        } else {
            findZohoTab((tab) => {
                if (tab) verifyConnection(tab);
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
                // Ensure PING works first to confirm context?
                // Or just proceed with injection traversal logic.
                // The original logic was robust enough with frame traversal.

                const results = await chrome.scripting.executeScript({
                    target: { tabId: tabId, allFrames: true },
                    world: 'MAIN',
                    func: () => {
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
                                    // console.warn('[ZohoIDE] sendMessage runtime error:', chrome.runtime.lastError);
                                    resolve({ error: chrome.runtime.lastError.message });
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

    // Phase 3: Focus Event
    if (request.type === 'ZO_FOCUS_GAINED') {
        const tabId = sender.tab ? sender.tab.id : null;
        if (tabId && request.metadata) {
            const meta = request.metadata;
            const id = (meta.functionId && meta.functionId !== "unknown") ? meta.functionId : (meta.url || "global");
            const fileId = `${meta.orgId}:${meta.system}:${id}`;

            registerTab(tabId, fileId);

            broadcastToIDE({
                type: 'ZO_FOCUS_GAINED',
                tabId: tabId,
                fileId: fileId,
                metadata: request.metadata
            });
        }
    }
});

async function getAllZohoTabs(callback) {
    chrome.tabs.query({}, async (allTabs) => {
        const zohoTabs = allTabs.filter(t => t.url && isZohoUrl(t.url)).sort((a, b) => a.id - b.id);

        const metadataPromises = zohoTabs.map(tab => getTabMetadata(tab.id).catch(() => null));
        const allMetadata = await Promise.all(metadataPromises);

        const results = zohoTabs.map((tab, index) => {
            const metadata = allMetadata[index];
            const inferredSystem = getSystemFromUrl(tab.url);
            const inferredOrg = getOrgFromUrl(tab.url) || 'global';

            return {
                tabId: tab.id,
                windowId: tab.windowId,
                active: tab.active,
                title: tab.title,
                url: tab.url,
                tabSequence: index + 1,
                ...(metadata || {
                    system: inferredSystem,
                    orgId: inferredOrg,
                    functionId: 'unknown',
                    functionName: tab.title,
                    folder: 'General'
                })
            };
        });

        callback(results);
    });
}

function getSystemFromUrl(url) {
    if (url.includes('crm.zoho')) return 'CRM';
    if (url.includes('creator.zoho')) return 'Creator';
    if (url.includes('flow.zoho')) return 'Flow';
    if (url.includes('books.zoho')) return 'Books';
    return 'Zoho';
}

function getOrgFromUrl(url) {
    try {
        const u = new URL(url);
        const parts = u.pathname.split('/');

        if (u.host.includes('crm')) {
            if (parts[1] === 'crm') {
                if (parts[2] && parts[2] !== 'org') return parts[2];
                if (parts[2] === 'org' && parts[3]) return parts[3];
            }
        }

        if (u.host.includes('creator')) {
            let appIdx = parts.indexOf('app');
            if (appIdx !== -1 && parts[appIdx+1]) return parts[appIdx+1];
            if (parts[1] && !['admin', 'builder', 'zp'].includes(parts[1])) {
                return parts[2] || parts[1];
            }
        }

        if (u.host.includes('flow')) {
            if (parts[1] === 'flow' && parts[2] && isNaN(parts[2])) return parts[2];
        }

        const sub = u.host.split('.')[0];
        if (sub && !['www', 'app', 'creator', 'crm', 'flow', 'books'].includes(sub)) return sub;

        return sub || 'Zoho';
    } catch(e) { return 'Zoho'; }
}

async function getTabMetadata(tabId) {
    const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms));

    try {
        const editorResults = await Promise.race([
            chrome.scripting.executeScript({
                target: { tabId: tabId, allFrames: true },
                world: 'MAIN',
                func: () => {
                    const hasMonaco = !!(window.monaco && (window.monaco.editor || window.monaco.languages));
                    const hasAce = !!(window.ace && window.ace.edit) || !!document.querySelector('.ace_editor, .zace-editor, lyte-ace-editor');
                    const hasZEditor = !!(window.ZEditor || window.Zace);
                    return hasMonaco || hasAce || hasZEditor;
                }
            }),
            timeout(1500)
        ]).catch(() => []);

        const frames = await new Promise(resolve => {
            chrome.webNavigation.getAllFrames({ tabId: tabId }, (f) => resolve(f || []));
        });

        const metaPromises = frames.map(frame => {
            return new Promise(resolve => {
                chrome.tabs.sendMessage(tabId, { action: 'GET_ZOHO_METADATA' }, { frameId: frame.frameId }, (res) => {
                    if (chrome.runtime.lastError) resolve(null);
                    else {
                        if (res) {
                            res.frameId = frame.frameId;
                            const editorRes = editorResults.find(r => r.frameId === frame.frameId);
                            res.hasEditor = !!editorRes?.result;
                        }
                        resolve(res);
                    }
                });
            });
        });

        const allMeta = (await Promise.all(metaPromises)).filter(m => m && m.system);
        if (allMeta.length === 0) return null;

        return allMeta.sort((a, b) => {
            if (a.hasEditor !== b.hasEditor) return a.hasEditor ? -1 : 1;
            if (a.functionId !== b.functionId) {
                if (a.functionId === 'unknown') return 1;
                if (b.functionId === 'unknown') return -1;
            }
            return (a.frameId || 0) - (b.frameId || 0);
        })[0];

    } catch (e) {
        console.warn(`[ZohoIDE] Metadata extraction failed for tab ${tabId}:`, e.message);
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
