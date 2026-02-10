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
        if (targetTabId) handleOpen(targetTabId);
        else findZohoTab(tab => tab && handleOpen(tab.id));
        sendResponse({ success: true });
        return true;
    }

    if (request.action === 'GET_ZOHO_CODE' || request.action === 'SET_ZOHO_CODE' || request.action === 'SAVE_ZOHO_CODE' || request.action === 'EXECUTE_ZOHO_CODE') {
        const handleAction = (tabId) => {
            lastZohoTabId = tabId;

            // 1. Try Main Frame
            chrome.tabs.sendMessage(tabId, request, { frameId: 0 }, (mainResponse) => {
                const isGet = request.action === 'GET_ZOHO_CODE';
                const mainSuccess = mainResponse && (isGet ? !!mainResponse.code : !!mainResponse.success);

                if (!chrome.runtime.lastError && mainSuccess) {
                    sendResponse(mainResponse);
                } else {
                    // 2. Try All Subframes
                    chrome.scripting.executeScript({
                        target: { tabId: tabId, allFrames: true },
                        func: () => {
                            return !!(document.querySelector('.ace_editor, .monaco-editor, .CodeMirror, [id*="delugeEditor"], .deluge-editor'));
                        }
                    }, (results) => {
                        if (!results || results.length === 0) {
                            sendResponse(mainResponse || { error: 'No editor found in any frame' });
                            return;
                        }

                        const potentialFrames = results.filter(r => r.result === true && r.frameId !== 0);
                        if (potentialFrames.length === 0) {
                            sendResponse(mainResponse || { error: 'No editor found in subframes' });
                            return;
                        }

                        let responded = false;
                        let count = 0;
                        potentialFrames.forEach(frame => {
                            chrome.tabs.sendMessage(tabId, request, { frameId: frame.frameId }, (subResponse) => {
                                count++;
                                if (responded) return;

                                const subSuccess = subResponse && (isGet ? !!subResponse.code : !!subResponse.success);
                                if (!chrome.runtime.lastError && subSuccess) {
                                    responded = true;
                                    sendResponse(subResponse);
                                } else if (count === potentialFrames.length) {
                                    sendResponse(mainResponse || subResponse || { error: 'Action failed in all frames' });
                                }
                            });
                        });
                    });
                }
            });
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
    return domains.some(d => url.includes(d)) || url.includes("zoho.");
}
