// Background script for Zoho Deluge IDE

let lastZohoTabId = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Determine which tab to target.
    // If we're in sidepanel mode, sender.tab.id is the Zoho tab.
    // If we're in standalone tab, sender.tab.id is the IDE tab itself (don't use it).

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
                        // Try to focus it
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
                    if (response && response.code !== undefined) {
                        sendResponse(response);
                    } else {
                        sendResponse({ error: 'No editor found in any frame. Try refreshing the Zoho page.' });
                    }
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
                    sendResponse({ error: 'No Zoho Deluge tab found. Open a Zoho editor first.' });
                }
            });
        }
        return true;
    }

    if (request.action === 'SET_ZOHO_CODE') {
        const handleSet = (tabId) => {
            chrome.tabs.sendMessage(tabId, { action: 'SET_ZOHO_CODE', code: request.code }, (response) => {
                sendResponse(response || { error: 'Failed to push. Is the Zoho tab still open?' });
            });
        };

        if (targetTabId) {
            handleSet(targetTabId);
        } else if (lastZohoTabId) {
            // Check if lastZohoTabId is still valid
            chrome.tabs.get(lastZohoTabId, (tab) => {
                if (!chrome.runtime.lastError && tab) {
                    handleSet(lastZohoTabId);
                } else {
                    findZohoTab((tab) => {
                        if (tab) {
                            handleSet(tab.id);
                        } else {
                            sendResponse({ error: 'No Zoho tab connected' });
                        }
                    });
                }
            });
        } else {
            findZohoTab((tab) => {
                if (tab) {
                    handleSet(tab.id);
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
    // Look in all windows for a Zoho tab
    chrome.tabs.query({}, (allTabs) => {
        const zohoTabs = allTabs.filter(t => t.url && isZohoUrl(t.url));

        if (zohoTabs.length === 0) {
            callback(null);
            return;
        }

        // Prioritize the active tab if it's Zoho
        const activeZoho = zohoTabs.find(t => t.active);
        if (activeZoho) {
            callback(activeZoho);
            return;
        }

        // Prioritize tabs that look like editors
        const editorTab = zohoTabs.find(t =>
            t.url.includes('creator') ||
            t.url.includes('crm') ||
            t.url.includes('recruit') ||
            t.url.includes('books') ||
            t.url.includes('workflow') ||
            t.url.includes('builder') ||
            t.title.toLowerCase().includes('deluge') ||
            t.title.toLowerCase().includes('editor')
        );

        callback(editorTab || zohoTabs[0]);
    });
}

function isZohoUrl(url) {
    if (!url) return false;
    return url.includes('zoho.com') ||
           url.includes('zoho.eu') ||
           url.includes('zoho.in') ||
           url.includes('zoho.com.au') ||
           url.includes('zoho.jp');
}
