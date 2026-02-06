document.getElementById('openIDE').addEventListener('click', () => {
    // Opening in a new tab. In MV3, if we don't specify windowId, it usually
    // defaults to the current window, which preserves incognito.
    // However, to be certain, we'll explicitly use the current window.
    chrome.windows.getCurrent((win) => {
        chrome.tabs.create({
            url: chrome.runtime.getURL('ide.html'),
            windowId: win.id
        });
        window.close();
    });
});

document.getElementById('openInPage').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab) {
            chrome.tabs.sendMessage(activeTab.id, { action: 'INJECT_SIDE_PANEL' }, (response) => {
                if (chrome.runtime.lastError) {
                    alert('Cannot inject IDE here. Make sure you are on a Zoho page and refresh it.');
                } else {
                    window.close();
                }
            });
        }
    });
});
