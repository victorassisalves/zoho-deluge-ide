// Background script for Zoho Deluge IDE

let lastZohoTabId = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Determine which tab to target.
    // If the message comes from a content script or an injected iframe, use that tab.
    let targetTabId = sender.tab ? sender.tab.id : null;

    if (request.action === 'CHECK_CONNECTION') {
        if (targetTabId) {
            chrome.tabs.get(targetTabId, (tab) => {
                sendResponse({ connected: true, tabTitle: tab.title });
            });
        } else {
            findZohoTab((tab) => {
                if (tab) {
                    sendResponse({ connected: true, tabTitle: tab.title });
                } else {
                    sendResponse({ connected: false });
                }
            });
        }
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
                        sendResponse({ error: 'No editor found in any frame' });
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
                    sendResponse({ error: 'No Zoho Deluge tab found' });
                }
            });
        }
        return true;
    }

    if (request.action === 'SET_ZOHO_CODE') {
        const handleSet = (tabId) => {
            chrome.tabs.sendMessage(tabId, { action: 'SET_ZOHO_CODE', code: request.code }, (response) => {
                sendResponse(response || { error: 'Failed to push' });
            });
        };

        if (targetTabId) {
            handleSet(targetTabId);
        } else if (lastZohoTabId) {
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
        return true;
    }

    if (request.action === 'ZOHO_CONSOLE_UPDATE') {
        // Forward console update to IDE tab OR iframe
        // We broadcast this to all extension parts.
        // If it's a side panel, only the one in the same tab should ideally process it,
        // but since we deduplicate by content, it's usually fine.
        chrome.runtime.sendMessage({
            action: 'IDE_CONSOLE_UPDATE',
            data: request.data,
            sourceTabId: targetTabId
        });
    }
});

function findZohoTab(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        let tab = tabs[0];
        if (tab && isZohoUrl(tab.url)) {
            callback(tab);
            return;
        }

        chrome.tabs.query({}, (allTabs) => {
            const zohoTabs = allTabs.filter(t => t.url && isZohoUrl(t.url));
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
