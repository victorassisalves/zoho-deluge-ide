// Background script for Zoho Deluge IDE

let lastZohoTabId = null;

chrome.commands.onCommand.addListener((command) => {
    if (command === "open-ide") {
        chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
            const activeTab = activeTabs[0];

            if (activeTab && isZohoUrl(activeTab.url)) {
                // If on Zoho tab, try to inject/toggle side panel
                chrome.tabs.sendMessage(activeTab.id, { action: 'INJECT_SIDE_PANEL' }, (response) => {
                    if (chrome.runtime.lastError) {
                        // Content script not loaded yet, inject it
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
                // Not on Zoho tab, open full IDE
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
            chrome.windows.update(sender.tab ? sender.tab.windowId : tabId, { focused: true }); // focused true if possible
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
            chrome.tabs.sendMessage(tabId, { action: 'GET_ZOHO_CODE' }, (response) => {
                if (chrome.runtime.lastError) {
                    sendResponse({ error: 'Tab not responding' });
                } else {
                    sendResponse(response || { error: 'No response from tab' });
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
            chrome.tabs.sendMessage(tabId, request, (response) => {
                sendResponse(response || { error: 'Failed to perform action.' });
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
    // Note: To find incognito tabs, extension must have "allow in incognito" enabled.
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
    const domains = ['zoho.com', 'zoho.eu', 'zoho.in', 'zoho.com.au', 'zoho.jp', 'zoho.ca', 'zoho.uk'];
    return domains.some(d => url.includes(d));
}
