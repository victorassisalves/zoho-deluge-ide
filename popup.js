document.getElementById('open-ide').addEventListener('click', () => {
    chrome.windows.getCurrent((win) => {
        chrome.tabs.create({
            url: chrome.runtime.getURL('app/index.html'),
            windowId: win.id
        });
        window.close();
    });
});

document.getElementById('open-integrated-mode').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (!activeTab || !isZohoUrl(activeTab.url)) {
            alert('Please switch to a Zoho editor tab first.');
            return;
        }

        chrome.tabs.sendMessage(activeTab.id, { action: 'INJECT_SIDE_PANEL' }, (response) => {
            if (chrome.runtime.lastError) {
                chrome.scripting.executeScript({
                    target: { tabId: activeTab.id },
                    files: ['extension/host/content.js']
                }).then(() => {
                    setTimeout(() => {
                        chrome.tabs.sendMessage(activeTab.id, { action: 'INJECT_SIDE_PANEL' }, (resp) => {
                            if (!chrome.runtime.lastError) window.close();
                        });
                    }, 500);
                });
            } else {
                window.close();
            }
        });
    });
});

function checkConnection() {
    chrome.runtime.sendMessage({ action: 'CHECK_CONNECTION' }, (response) => {
        const statusEl = document.getElementById('status');
        if (response && response.connected) {
            statusEl.innerText = 'Connected: ' + (response.tabTitle || 'Zoho');
            statusEl.classList.add('connected');
        } else {
            statusEl.innerText = 'No Zoho tab detected';
        }
    });
}

function isZohoUrl(url) {
    if (!url) return false;
    const domains = ['zoho.com', 'zoho.eu', 'zoho.in', 'zoho.com.au', 'zoho.jp'];
    return domains.some(d => url.includes(d));
}

checkConnection();
