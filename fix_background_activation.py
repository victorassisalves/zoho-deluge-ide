import re

with open('background.js', 'r') as f:
    content = f.read()

# Define helper functions for open tab and side panel
helpers = """
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
            // Fallback if not on Zoho
            openIDETab();
        }
    });
}
"""

# Insert helpers after broadcastToIDE
content = content.replace("broadcastToIDE(message) {", helpers + "\\nbroadcastToIDE(message) {")

# Update onCommand
search = r'if \(command === "sync-save"\) \{.*?\} else if \(command === "open-integrated"\) \{.*?\}'
# Actually it's more complex now. Let's find the start of the chain.

on_command_block = """
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
"""

# Replace the whole listener
content = re.sub(r'chrome\.commands\.onCommand\.addListener\(.*?\}\);', on_command_block, content, flags=re.DOTALL)

with open('background.js', 'w') as f:
    f.write(content)
