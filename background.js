// Background script for Zoho Deluge IDE

let lastZohoTabId = null;

chrome.commands.onCommand.addListener((command) => {
    if (command === "open-ide") {
        chrome.tabs.query({ url: chrome.runtime.getURL('ide.html*') }, (tabs) => {
            if (tabs.length > 0) {
                chrome.tabs.update(tabs[0].id, { active: true });
            } else {
                chrome.tabs.create({ url: chrome.runtime.getURL('ide.html') });
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
                sendResponse({ connected: true, tabTitle: tab.title });
            });
        } else {
            findZohoTab((tab) => {
                if (tab) {
                    sendResponse({ connected: true, tabTitle: tab.title, isStandalone: true });
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
    const domains = ['zoho.com', 'zoho.eu', 'zoho.in', 'zoho.com.au', 'zoho.jp'];
    return domains.some(d => url.includes(d));
}
