import re

with open('background.js', 'r') as f:
    content = f.read()

# Fix the commands listener to be a single if/else if chain
search = r'chrome\.commands\.onCommand\.addListener\(\(command\) => \{(.*?)\}\);'
body = """
    if (command === "sync-save") {
        broadcastToIDE({ action: "CMD_SYNC_SAVE" });
    } else if (command === "sync-save-execute") {
        broadcastToIDE({ action: "CMD_SYNC_SAVE_EXECUTE" });
    } else if (command === "pull-code") {
        broadcastToIDE({ action: "CMD_PULL_CODE" });
    } else if (command === "open-ide") {
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
    } else if (command === "open-integrated") {
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
            }
        });
    }"""
content = re.sub(search, f"chrome.commands.onCommand.addListener((command) => {{{body}}});", content, flags=re.DOTALL)

with open('background.js', 'w') as f:
    f.write(content)
