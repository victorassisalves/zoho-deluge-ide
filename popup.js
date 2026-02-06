document.getElementById('openIDE').addEventListener('click', () => {
  chrome.windows.getCurrent((win) => {
    chrome.tabs.create({
      url: chrome.runtime.getURL('ide.html'),
      windowId: win.id
    });
  });
});
