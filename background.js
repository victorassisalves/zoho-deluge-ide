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
    // Send to extension pages (IDE tab or side panel iframe)
    chrome.runtime.sendMessage(message);
}

chrome.commands.onCommand.addListener((command) => {
    if (command === "sync-save") {
        broadcastToIDE({ action: "CMD_SYNC_SAVE" });
    } else if (command === "sync-save-execute") {
        broadcastToIDE({ action: "CMD_SYNC_SAVE_EXECUTE" });
    } else if (command === "pull-code") {
        broadcastToIDE({ action: "CMD_PULL_CODE" });
    } else if (command === "activate-ide") {
        chrome.storage.local.get(['activation_behavior'], (result) => {
            const behavior = result.activation_behavior || 'new-tab';
            if (behavior === 'new-tab') {
                openIDETab();
            } else if (behavior === 'side-panel') {
                openIDESidePanel();
            } else if (behavior === 'smart') {
                chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
                    const activeTab = activeTabs[0];
                    if (activeTab && isZohoUrl(activeTab.url)) {
                        openIDESidePanel();
                    } else {
                        openIDETab();
                    }
                });
            }
        });
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    let isSidePanel = sender.tab && isZohoUrl(sender.tab.url);
    let targetTabId = isSidePanel ? sender.tab.id : null;

    if (request.action === 'CHECK_CONNECTION') {
        if (targetTabId) {
            chrome.tabs.get(targetTabId, (tab) => {
                sendResponse({ connected: true, tabTitle: tab.title, url: tab.url });
            });
        } else {
            findZohoTab((tab) => {
                if (tab) {
                    sendResponse({ connected: true, tabTitle: tab.title, url: tab.url, isStandalone: true });
                } else {
                    sendResponse({ connected: false });
                }
            });
        }
        return true;
    }

    if (request.action === 'OPEN_ZOHO_EDITOR') {
        const handleOpen = (tabId) => {
            chrome.tabs.update(tabId, { active: true });
            chrome.windows.update(sender.tab ? sender.tab.windowId : tabId, { focused: true });
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: () => {
                    const ed = document.querySelector('[id*="delugeEditor"]') || document.querySelector('.ace_editor') || document.querySelector('.monaco-editor');
                    if (ed) {
                        ed.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        ed.click();
                        const inner = ed.querySelector('textarea, .ace_text-input, .monaco-mouse-cursor-text');
                        if (inner) inner.focus();
                    }
                }
            });
        };

        if (targetTabId) {
            handleOpen(targetTabId);
        } else {
            findZohoTab((tab) => {
                if (tab) handleOpen(tab.id);
            });
        }
        sendResponse({ success: true });
        return true;
    }

    if (request.action === 'GET_ZOHO_CODE') {
        const handleResponse = (tabId) => {
            lastZohoTabId = tabId;
            // Try main frame first
            chrome.tabs.sendMessage(tabId, { action: 'GET_ZOHO_CODE' }, (response) => {
                if (!chrome.runtime.lastError && response && response.code) {
                    sendResponse(response);
                } else {
                    // Try all frames if main frame fails
                    chrome.scripting.executeScript({
                        target: { tabId: tabId, allFrames: true },
                        func: () => {
                            // This runs in the context of the page, but we want to trigger the bridge
                            // Since we can't easily get the return value from a postMessage asyncly here,
                            // we just hope the content script in the right frame picks up the next message.
                            return !!(document.querySelector('.ace_editor, .monaco-editor, .CodeMirror, [id*="delugeEditor"]'));
                        }
                    }, (results) => {
                        const frameWithEditor = results?.find(r => r.result === true);
                        if (frameWithEditor && frameWithEditor.frameId !== 0) {
                            chrome.tabs.sendMessage(tabId, { action: 'GET_ZOHO_CODE' }, { frameId: frameWithEditor.frameId }, (res) => {
                                sendResponse(res || { error: 'No response from subframe' });
                            });
                        } else {
                            sendResponse(response || { error: 'No editor found' });
                        }
                    });
                }
            });
        };

        if (targetTabId) {
            handleResponse(targetTabId);
        } else {
            findZohoTab((tab) => {
                if (tab) {
                    handleResponse(tab.id);
                } else {
                    sendResponse({ error: 'No Zoho Deluge tab found.' });
                }
            });
        }
        return true;
    }

    if (request.action === 'SET_ZOHO_CODE' || request.action === 'SAVE_ZOHO_CODE' || request.action === 'EXECUTE_ZOHO_CODE') {
        const handleAction = (tabId) => {
            // Try main frame first
            chrome.tabs.sendMessage(tabId, request, (response) => {
                if (!chrome.runtime.lastError && response && response.success) {
                    sendResponse(response);
                } else {
                    // Try all frames
                    chrome.scripting.executeScript({
                        target: { tabId: tabId, allFrames: true },
                        func: () => {
                            return !!(document.querySelector('.ace_editor, .monaco-editor, .CodeMirror, [id*="delugeEditor"]'));
                        }
                    }, (results) => {
                        const frameWithEditor = results?.find(r => r.result === true);
                        if (frameWithEditor && frameWithEditor.frameId !== 0) {
                            chrome.tabs.sendMessage(tabId, request, { frameId: frameWithEditor.frameId }, (res) => {
                                sendResponse(res || { error: 'No response from subframe' });
                            });
                        } else {
                            sendResponse(response || { error: 'Failed to perform action.' });
                        }
                    });
                }
            });
        };

        if (targetTabId) {
            handleAction(targetTabId);
        } else if (lastZohoTabId) {
            chrome.tabs.get(lastZohoTabId, (tab) => {
                if (!chrome.runtime.lastError && tab) {
                    handleAction(lastZohoTabId);
                } else {
                    findZohoTab((tab) => {
                        if (tab) {
                            handleAction(tab.id);
                        } else {
                            sendResponse({ error: 'No Zoho tab connected' });
                        }
                    });
                }
            });
        } else {
            findZohoTab((tab) => {
                if (tab) {
                    handleAction(tab.id);
                } else {
                    sendResponse({ error: 'No Zoho tab connected' });
                }
            });
        }
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
        if (zohoTabs.length === 0) {
            callback(null);
            return;
        }
        const activeZoho = zohoTabs.find(t => t.active);
        if (activeZoho) {
            callback(activeZoho);
            return;
        }
        const editorTab = zohoTabs.find(t =>
            t.url.includes('creator') ||
            t.url.includes('crm') ||
            t.url.includes('flow') ||
            t.url.includes('recruit') ||
            t.url.includes('books') ||
            t.title.toLowerCase().includes('deluge') ||
            t.title.toLowerCase().includes('editor')
        );
        callback(editorTab || zohoTabs[0]);
    });
}

function isZohoUrl(url) {
    if (!url) return false;
    const domains = ["zoho.com", "zoho.eu", "zoho.in", "zoho.com.au", "zoho.jp", "zoho.ca", "zoho.uk", "zoho.com.cn"];
    return domains.some(d => url.includes(d)) || url.includes("zoho.");
}
