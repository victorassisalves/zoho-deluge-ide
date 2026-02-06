document.getElementById('openIDE').addEventListener('click', () => {
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
        if (!activeTab || !isZohoUrl(activeTab.url)) {
            alert('Please switch to a Zoho editor tab first.');
            return;
        }

        // Try to wake up the content script
        chrome.tabs.sendMessage(activeTab.id, { action: 'INJECT_SIDE_PANEL' }, (response) => {
            if (chrome.runtime.lastError) {
                // If it fails, maybe it's not injected. Try manual injection.
                console.log('Content script not responding, attempting manual injection...');
                chrome.scripting.executeScript({
                    target: { tabId: activeTab.id },
                    files: ['content.js']
                }).then(() => {
                    // Give it a moment and try again
                    setTimeout(() => {
                        chrome.tabs.sendMessage(activeTab.id, { action: 'INJECT_SIDE_PANEL' }, (resp) => {
                            if (chrome.runtime.lastError) {
                                alert('Failed to inject IDE. Please refresh the page and try again.');
                            } else {
                                window.close();
                            }
                        });
                    }, 500);
                }).catch(err => {
                    console.error(err);
                    alert('Cannot access this page. Ensure it is a Zoho domain and you have granted permissions.');
                });
            } else {
                window.close();
            }
        });
    });
});

function isZohoUrl(url) {
    if (!url) return false;
    return url.includes('zoho.com') ||
           url.includes('zoho.eu') ||
           url.includes('zoho.in') ||
           url.includes('zoho.com.au') ||
           url.includes('zoho.jp');
}
