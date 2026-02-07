import re

with open('background.js', 'r') as f:
    content = f.read()

# Improve message handling to prioritize sender tab
new_message_handler = """chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Determine the target tab. If the message comes from a content script (sender.tab),
    // prioritize that tab. This is crucial for Integrated Mode.
    let targetTabId = sender.tab ? sender.tab.id : null;

    if (request.action === 'CHECK_CONNECTION') {
        const checkTab = (tabId) => {
            chrome.tabs.sendMessage(tabId, { action: 'PING' }, (response) => {
                if (chrome.runtime.lastError) {
                    sendResponse({ connected: false });
                } else {
                    sendResponse({ connected: true, url: sender.tab.url });
                }
            });
        };

        if (targetTabId) {
            checkTab(targetTabId);
        } else {
            findZohoTab((tab) => {
                if (tab) {
                    checkTab(tab.id);
                } else {
                    sendResponse({ connected: false });
                }
            });
        }
        return true;
    }

    if (request.action === 'OPEN_IDE_TAB') {
        const url = chrome.runtime.getURL('ide.html');
        chrome.tabs.create({ url: url });
        sendResponse({ success: true });
    }

    if (request.action === 'TOGGLE_SIDE_PANEL') {
        const handleOpen = (tabId) => {
            chrome.tabs.sendMessage(tabId, { action: 'INJECT_SIDE_PANEL' }, (response) => {
                if (chrome.runtime.lastError) {
                    // Fallback to script injection if message fails
                    chrome.scripting.executeScript({
                        target: { tabId: tabId },
                        files: ['content.js']
                    }).then(() => {
                        chrome.tabs.sendMessage(tabId, { action: 'INJECT_SIDE_PANEL' });
                    });
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
"""

# I need to be careful with the replacement as TOGGLE_SIDE_PANEL logic might be different
# Let's see the current background.js content again.
