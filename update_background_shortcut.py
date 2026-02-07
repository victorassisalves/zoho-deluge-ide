import re

with open('background.js', 'r') as f:
    content = f.read()

new_on_command = """chrome.commands.onCommand.addListener((command) => {
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
});"""

pattern = r'chrome\.commands\.onCommand\.addListener\(\(command\) => \{.*?\}\);\n\n'
content = re.sub(pattern, new_on_command + '\n\n', content, flags=re.DOTALL)

with open('background.js', 'w') as f:
    f.write(content)
